// ---------------------------------------------------------------------------
// The sync engine — extracted from FlashcardCatalog.jsx so the subtlest logic
// in the app lives somewhere testable and reviewable on its own.
//
// What this hook owns:
//   * the local-persistence debounce (400ms) that writes the whole payload to
//     localStorage and pushes it to Firestore
//   * the realtime listener that adopts changes made on other devices
//   * the ownership bookkeeping (ownerUidRef) that stops one account's data
//     ever being written into another's document
//   * the timestamp guards (updatedAtRef, skipNextPush) that keep an incoming
//     snapshot from clobbering an in-flight local edit
//
// Known limitation (deliberately NOT fixed here — see the per-card sync plan
// in the project notes): the payload is the whole document and conflict
// detection is timestamp-based, so two devices editing concurrently is
// last-writer-wins for the entire catalog. The read-before-write in safePush
// only protects against out-of-order arrivals, and there is a TOCTOU window
// between pullData and setDocument. Whole-doc sync stays in place until the
// per-card migration ships; this extraction is the step that makes that
// migration possible without touching the UI.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import * as firebaseSync from "./firebaseSync";
import * as G from "./gamification";
import { report } from "./report";
import * as cardSync from "./cardSync";
import * as guards from "./syncGuards";

const STORAGE_KEY = "flashcard-catalog-data";

// localStorage-backed persistence — works standalone in the web app and in
// the APK (Capacitor's WebView gives us a real localStorage).
export const storage = {
  async get(key) {
    try {
      const value = window.localStorage.getItem(key);
      return { value };
    } catch (e) {
      return { value: null };
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },
};

// A remote payload with no subjects and no cards is either a legitimate "user
// deleted everything" or a corrupted/half-written sync. We can't tell those
// apart, so when local data isn't empty we treat it as suspicious: keep the
// local data and push it back up instead of wiping the device.
export const isEmptyPayload = (p) =>
  (!p.subjects || p.subjects.length === 0) && (!p.cards || p.cards.length === 0);

// `migrate` is { migrateSubjects, migrateCards } from the caller — they live
// with the tree helpers because the UI needs them too.
export function useSyncEngine({ subjects, cards, game, setSubjects, setCards, setGame, setError, migrate }) {
  const [loaded, setLoaded] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | synced | error

  const saveTimer = useRef(null);
  const updatedAtRef = useRef(0);
  const skipNextPush = useRef(false);
  const currentDataRef = useRef({ subjects: [], cards: [], game: G.emptyGame() });
  // Which Google account the data currently in `subjects`/`cards` belongs to.
  // null means it has never been synced to any account yet.
  const ownerUidRef = useRef(null);
  // ---------- per-card sync state ----------
  // perCardMode flips on once the account's parent doc carries
  // cardsMigratedAt. From then on cards travel as individual documents in
  // users/{uid}/cards and the cards array on the parent doc is ignored
  // (left in place as the rollback path). cardMapRef holds every card
  // including tombstones; pushedRef remembers each card's timestamp at its
  // last successful push so only the dirty ones go up.
  // Has this session actually taken this account's remote parent state (its
  // subject tree and game) into local state? Until it has, this client knows
  // nothing about the catalog it is signed into, and syncGuards refuses to
  // let it shrink one. Reset on sign-out and on an account switch.
  const parentAdoptedRef = useRef(false);
  // True for the duration of handleSignIn. The restore-a-session effect below
  // also enters per-card mode, and it used to be able to do so *during*
  // sign-in — flipping perCardModeRef while handleSignIn was still awaiting
  // its pull, which made handleSignIn skip applyRemote and then push the
  // device's own empty subjects over the account. See handleSignIn.
  const signingInRef = useRef(false);
  const perCardModeRef = useRef(false);
  // The ref is what the sync paths read (they run outside render); this state
  // mirrors it so the listener effect below can actually re-run when per-card
  // mode turns on. A ref flipping does not retrigger an effect, which is why
  // the cards-subcollection listener used to be skipped entirely whenever the
  // effect happened to run before enterPerCardMode finished.
  const [perCardMode, setPerCardMode] = useState(false);
  const cardMapRef = useRef({});
  const pushedRef = useRef({});
  const migratedAtRef = useRef(null);

  useEffect(() => {
    currentDataRef.current = { subjects, cards, game };
  }, [subjects, cards, game]);

  // Keep the card map in step with local edits, stamping whatever changed.
  // The stamping used to happen only for cards that arrived without an
  // updatedAt at all, which meant studying a card — the single most common
  // edit in the app — left its timestamp untouched and the progress was
  // dropped on the next load. See applyLocalEdits.
  useEffect(() => {
    cardMapRef.current = cardSync.applyLocalEdits(cardMapRef.current, cards, {
      perCardMode: perCardModeRef.current,
    });
  }, [cards]);

  // ---------- load ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setSubjects(migrate.migrateSubjects(parsed.subjects || []));
          const loadedCards = migrate.migrateCards(parsed.cards || []);
          setCards(loadedCards);
          // Seed the per-card map so the first sign-in merge knows what this
          // device already holds (offline-created cards, edits since the
          // last sync). Without this they look like remote-only deletions.
          cardMapRef.current = cardSync.toCardMap(loadedCards);
          // rollOver settles any missed days (spending freezes) the moment the
          // app opens, so the streak number on screen is never stale.
          setGame(G.rollOver(G.normalizeGame(parsed.game)));
          updatedAtRef.current = parsed.updatedAt || 0;
          ownerUidRef.current = parsed.ownerUid || null;
        }
      } catch (e) {
        // no existing data yet, that's fine
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- restore Firebase session ----------
  // Subscribed, not polled once. See firebaseSync.onAuthStateChanged: a
  // one-shot getCurrentUser() on mount reads null on the web every time,
  // because the SDK restores the persisted session asynchronously — the app
  // then rendered as signed out on every reload, which is what made a synced
  // catalog look empty in the browser while the phone was fine.
  //
  // This also covers sign-out, so the listener is the single source of truth
  // for `googleUser` rather than one of two competing ones.
  useEffect(() => {
    let handle;
    let cancelled = false;
    firebaseSync.onAuthStateChanged((user) => {
      if (cancelled) return;
      // Keep the object identity stable when the account hasn't actually
      // changed. handleSignIn also sets googleUser, so without this the
      // listener's echo would hand every effect keyed on googleUser a fresh
      // object and make them tear down and re-register their Firestore
      // listeners for no reason.
      setGoogleUser((prev) => (prev?.uid === user?.uid ? prev : user));
    }).then((h) => {
      if (cancelled) h?.remove?.();
      else handle = h;
    }).catch((e) => report("session.restore", e));
    return () => {
      cancelled = true;
      handle?.remove?.();
    };
  }, []);

  const applyRemote = (remote) => {
    skipNextPush.current = true;
    setSubjects(migrate.migrateSubjects(remote.subjects || []));
    // Once cardsMigratedAt is on the parent doc, its cards array is a frozen
    // pre-migration snapshot kept only as the rollback path for old clients —
    // it is never written again, so it is stale the moment anything changes.
    // Adopting it here replaces the live catalog with an out-of-date one, or
    // (post-migration, when the array was emptied) with nothing at all. This
    // is what left the web app showing an empty catalog while the phone was
    // fine: a page reload restores the session without entering per-card mode,
    // and the parent listener then handed this function an empty array.
    // Cards in this state come from the subcollection only.
    if (!remote.cardsMigratedAt) setCards(migrate.migrateCards(remote.cards || []));
    // A payload written by an older version of the app has no `game` at all.
    // Adopting it verbatim would silently reset a streak the user built here,
    // so in that case we keep whatever this device already has.
    if (remote.game) setGame(G.rollOver(G.normalizeGame(remote.game)));
    updatedAtRef.current = remote.updatedAt || Date.now();
    parentAdoptedRef.current = true;
  };

  const acceptRemoteIfNewer = (remote, user) => {
    if (!remote || (remote.updatedAt || 0) <= updatedAtRef.current) return;
    const local = currentDataRef.current;
    const localBelongsToThisUser = ownerUidRef.current === user.uid;
    const localHasData = local.subjects.length > 0 || local.cards.length > 0;
    if (isEmptyPayload(remote) && localHasData && localBelongsToThisUser) {
      firebaseSync.pushData(user.uid, { ...local, updatedAt: Date.now(), ownerUid: user.uid })
        .catch((e) => report("sync.repushAfterEmptyRemote", e));
      return;
    }
    ownerUidRef.current = user.uid;
    applyRemote(remote);
  };

  // Take the parent document's subjects and game as this session's own.
  const adoptParent = (remote) => {
    skipNextPush.current = true;
    setSubjects(migrate.migrateSubjects(remote.subjects || []));
    if (remote.game) setGame(G.rollOver(G.normalizeGame(remote.game)));
    updatedAtRef.current = remote.updatedAt || Date.now();
    parentAdoptedRef.current = true;
  };

  // In per-card mode the parent doc carries subjects/game only — an empty
  // cards array on it is normal, not a wipe. The guard above must not fire.
  const acceptRemoteParentIfNewer = (remote, user) => {
    if (perCardModeRef.current) {
      if (!remote || (remote.updatedAt || 0) <= updatedAtRef.current) return;
      adoptParent(remote);
      return;
    }
    acceptRemoteIfNewer(remote, user);
  };

  // Push only the cards that changed since their last successful push, then
  // the parent doc (subjects/game) without live cards. Tombstones past the
  // retention window are hard-deleted remotely and dropped locally.
  const pushPerCard = async (uid, subjectsPayload, gamePayload) => {
    // Before shrinking someone's subject tree, be sure this session has read
    // it. Only checked when we'd be writing fewer subjects than we last saw,
    // so the ordinary push stays a single write with no extra read.
    if ((subjectsPayload || []).length === 0) {
      const current = await firebaseSync.pullData(uid);
      if (guards.refusesParentPush({ subjects: subjectsPayload, adopted: parentAdoptedRef.current, remote: current })) {
        report("sync.refusedEmptyParentPush", new Error(
          `refused to write 0 subjects over ${(current.subjects || []).length} for ${uid}`
        ));
        // Adopt unconditionally — not through the timestamp guard. This
        // client's clock-stamped emptiness may well *look* newer than the
        // real catalog; that is exactly the state we're refusing to trust.
        adoptParent(current);
        return;
      }
    }
    const { map, swept } = cardSync.sweepTombstones(cardMapRef.current);
    cardMapRef.current = map;
    const dirty = cardSync.diffDirty(map, pushedRef.current);
    if (dirty.length) {
      const written = await cardSync.pushCards(uid, dirty);
      const next = { ...pushedRef.current };
      for (const id of written) {
        const c = map[id];
        next[id] = (c && (c.deletedAt || c.updatedAt)) || 0;
      }
      pushedRef.current = next;
    }
    if (swept.length) {
      await cardSync.hardDeleteCards(uid, swept);
      const next = { ...pushedRef.current };
      for (const id of swept) delete next[id];
      pushedRef.current = next;
    }
    // NOTE: `cards` is deliberately absent, and this is a merging write. The
    // parent document's pre-migration cards array must survive untouched —
    // clients on older builds still read their catalog from it, and handing
    // them an empty array wipes those devices. See pushParentData.
    await firebaseSync.pushParentData(uid, {
      subjects: subjectsPayload,
      game: gamePayload,
      updatedAt: updatedAtRef.current,
      ownerUid: uid,
      cardsMigratedAt: migratedAtRef.current,
    });
  };

  // A snapshot of the whole cards subcollection arrived: merge per card and
  // adopt whatever changed. The merge compares per-card timestamps, so a card
  // this device edited seconds ago isn't rolled back by an echo of its own
  // older state.
  const adoptRemoteCards = (remoteMap) => {
    const merged = cardSync.mergeCardMaps(cardMapRef.current, remoteMap);
    cardMapRef.current = merged;
    // Everything the server has, we have now seen.
    const pushed = { ...pushedRef.current };
    for (const [id, c] of Object.entries(remoteMap)) {
      pushed[id] = Math.max(pushed[id] || 0, c.deletedAt || c.updatedAt || 0);
    }
    pushedRef.current = pushed;
    skipNextPush.current = true; // adopting remote cards must not retrigger a push of them
    setCards(migrate.migrateCards(cardSync.liveCards(merged)));
  };

  // Re-reads the remote document immediately before writing so a write from
  // another concurrently-signed-in session (e.g. testing on two devices with
  // the same account) can't be silently clobbered by an older payload landing
  // a moment later. If the remote turns out to be newer than what we're about
  // to send, we adopt it instead of overwriting it.
  const safePush = async (uid, payload) => {
    const current = await firebaseSync.pullData(uid);
    if (current && (current.updatedAt || 0) > payload.updatedAt) {
      acceptRemoteIfNewer(current, { uid });
      return;
    }
    // pushData overwrites the whole document, so a session that never read
    // this account can erase the subject tree, the cards array and the game
    // in one write — with a fresh timestamp, which is why the check above
    // doesn't catch it.
    if (guards.refusesLegacyPush({ payload, adopted: parentAdoptedRef.current, remote: current })) {
      report("sync.refusedEmptyLegacyPush", new Error(
        `refused to overwrite ${(current.subjects || []).length} subjects / ${(current.cards || []).length} cards with nothing for ${uid}`
      ));
      ownerUidRef.current = uid;
      applyRemote(current);
      return;
    }
    await firebaseSync.pushData(uid, payload);
  };

  // ---------- save (debounced) ----------
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const shouldPush = !skipNextPush.current;
    skipNextPush.current = false;
    // Bump the local edit timestamp right away, not inside the debounced
    // callback below. Otherwise, for the whole 400ms debounce window after a
    // real edit, updatedAtRef still holds the *previous* edit's timestamp —
    // and if a Firestore snapshot from another signed-in device arrives
    // during that window (acceptRemoteIfNewer, above), it looks "newer than
    // local" and silently overwrites the edit before it was ever saved.
    // Skip this when the change came from applyRemote (shouldPush false) —
    // it already set updatedAtRef to the remote's own timestamp, which is
    // more accurate than "now" for judging future incoming snapshots.
    if (shouldPush) updatedAtRef.current = Date.now();
    // Persist the stamped cards (with per-card updatedAt), not raw state —
    // the stamps are what let the next launch's merge tell fresh local edits
    // from stale remote echoes.
    const stampedCards = cardSync.liveCards(cardMapRef.current);
    const payload = { subjects, cards: stampedCards, game, updatedAt: updatedAtRef.current, ownerUid: ownerUidRef.current };
    saveTimer.current = setTimeout(async () => {
      try {
        const result = await storage.set(STORAGE_KEY, JSON.stringify(payload));
        if (!result) setError("Couldn't save — your last change may not persist.");
        else setError("");
      } catch (e) {
        report("sync.saveLocal", e);
        setError("Couldn't save — your last change may not persist.");
      }
      // Only push to Firestore if this data is actually attributed to the
      // signed-in account — otherwise a leftover local copy from a previous
      // account could get written into someone else's document.
      if (shouldPush && googleUser && ownerUidRef.current === googleUser.uid) {
        setSyncState("syncing");
        try {
          if (perCardModeRef.current) {
            await pushPerCard(googleUser.uid, payload.subjects, payload.game);
          } else {
            await safePush(googleUser.uid, payload);
          }
          setSyncState("synced");
        } catch (e) {
          // Without this, the header goes red and "Copy diagnostics" comes
          // back empty — the one path most likely to be reported is the one
          // that left no evidence.
          report("sync.push", e);
          setSyncState("error");
        }
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, cards, game, loaded, googleUser]);

  // ---------- realtime listener: pick up changes made on other devices ----------
  // Gated on `loaded` too: until local storage has been read, updatedAtRef.current
  // is still its initial 0, so an empty/stale remote document would look "newer"
  // than local data that hasn't been read into the ref yet and wipe it out.
  useEffect(() => {
    if (!googleUser || !loaded) return;
    let callbackId;
    let cancelled = false;
    firebaseSync.listenToData(googleUser.uid, (remote, listenError) => {
      if (listenError) {
        report("sync.listener", listenError);
        setSyncState("error");
        return;
      }
      acceptRemoteParentIfNewer(remote, googleUser);
      setSyncState("synced");
    }).then((id) => {
      if (cancelled) firebaseSync.stopListening(id);
      else callbackId = id;
    }).catch((e) => { report("sync.listenSetup", e); setSyncState("error"); });
    // In per-card mode, also listen to the cards subcollection. Snapshots
    // merge per card; the parent listener above only carries subjects/game.
    let cardsCallbackId;
    // Depends on the `perCardMode` state (see the effect deps), so turning the
    // mode on re-runs this and attaches the listener. Reading only the ref
    // meant that if the mode flipped after this effect had already run, the
    // cards subcollection was never watched for the rest of the session.
    if (perCardMode) {
      cardSync.listenToCards(googleUser.uid, (remoteMap, cardsError) => {
        if (cardsError) { report("sync.cardsListener", cardsError); return; }
        adoptRemoteCards(remoteMap);
      }).then((id) => {
        if (cancelled) firebaseSync.stopListening(id);
        else cardsCallbackId = id;
      }).catch((e) => report("sync.cardsListenSetup", e));
    }
    return () => {
      cancelled = true;
      if (callbackId) firebaseSync.stopListening(callbackId);
      if (cardsCallbackId) firebaseSync.stopListening(cardsCallbackId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser, loaded, perCardMode]);

  // Decides, on sign-in, whether this account syncs cards per-document, and
  // runs the one-way migration if the parent doc still holds the cards array.
  // Afterwards cardMapRef/pushedRef reflect the server's state and perCardMode
  // is on. Local cards NOT yet on the server are merged in and pushed by the
  // normal dirty-set push that follows.
  const enterPerCardMode = async (uid, remote) => {
    let remoteCards;
    if (remote && remote.cardsMigratedAt) {
      migratedAtRef.current = remote.cardsMigratedAt;
      remoteCards = await cardSync.fetchCardMap(uid);
    } else {
      // First run since per-card sync shipped: lift the parent's cards array
      // into the subcollection. Idempotent — card ids are the document ids.
      migratedAtRef.current = Date.now();
      remoteCards = await cardSync.migrateCardsToSubcollection(uid, remote || {}, migratedAtRef.current);
    }
    cardMapRef.current = cardSync.mergeCardMaps(cardMapRef.current, remoteCards);
    const pushed = {};
    for (const [id, c] of Object.entries(remoteCards)) {
      pushed[id] = c.deletedAt || c.updatedAt || 0;
    }
    pushedRef.current = pushed;
    perCardModeRef.current = true;
    setPerCardMode(true);
    // Reflect the merge immediately so the UI doesn't show a stale list.
    skipNextPush.current = true;
    setCards(migrate.migrateCards(cardSync.liveCards(cardMapRef.current)));
  };

  // ---------- adopt per-card mode on a restored session ----------
  // enterPerCardMode used to be reachable only through handleSignIn, i.e. only
  // by clicking "Sign in with Google". Reopening the app or reloading the web
  // page restores the session without it, leaving the client in legacy mode:
  // it never fetched the cards subcollection, never listened to it, and read
  // its catalog from the parent doc's dead cards array. The phone looked fine
  // only because it was still inside the session where it had signed in.
  //
  // Only adopts, never migrates — an account with no cardsMigratedAt is left
  // alone for handleSignIn to migrate deliberately.
  useEffect(() => {
    // signingInRef: handleSignIn sets googleUser, which runs this effect while
    // that function is still deciding what this account's state is. Both then
    // raced to enter per-card mode, and whichever lost left handleSignIn
    // believing the mode had always been on — so it skipped adopting the
    // remote and pushed the device's empty subject tree over the account.
    // Sign-in owns this decision from start to finish; this effect is only
    // for sessions restored without it.
    if (!googleUser || !loaded || perCardModeRef.current || signingInRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await firebaseSync.pullData(googleUser.uid);
        if (cancelled || perCardModeRef.current || signingInRef.current) return;
        // Adopt when the local data already belongs to this account, or has
        // never been claimed by any account (null) — the same two cases
        // handleSignIn treats as "not switching accounts". A ref holding a
        // *different* uid is left alone: that's the account-switch path, and
        // merging there is exactly the bug that once pushed one account's
        // cards into another's document.
        const ownedHere = ownerUidRef.current === googleUser.uid || ownerUidRef.current === null;
        if (remote && remote.cardsMigratedAt && ownedHere) {
          ownerUidRef.current = googleUser.uid;
          await enterPerCardMode(googleUser.uid, remote);
          // A restored session must take the subject tree and game too. The
          // cards come from the subcollection, which is why this used to look
          // complete: cards appeared, the catalog around them didn't, and
          // this client then counted as "has data" while holding no subjects.
          if ((remote.updatedAt || 0) > updatedAtRef.current) adoptParent(remote);
          // Local is newer than the server's copy: nothing to adopt, but this
          // session has now seen what the account holds, which is what the
          // push guard actually asks about. Without this, deleting your last
          // subject on a device that was already signed in would be refused
          // as if it were a wipe.
          else parentAdoptedRef.current = true;
        }
      } catch (e) {
        report("sync.restorePerCardMode", e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser, loaded]);

  const handleSignIn = async () => {
    setSyncState("syncing");
    setError("");
    signingInRef.current = true;
    try {
      const user = await firebaseSync.signIn();
      setGoogleUser(user);
      const remote = await firebaseSync.pullData(user.uid);
      const switchingAccounts = ownerUidRef.current && ownerUidRef.current !== user.uid;

      if (switchingAccounts) {
        // The data currently on this device belongs to a different account —
        // never push it here. Adopt this account's own cloud data instead,
        // even if that means starting from an empty catalog.
        ownerUidRef.current = user.uid;
        parentAdoptedRef.current = false;
        perCardModeRef.current = false;
        cardMapRef.current = {};
        pushedRef.current = {};
        if (remote) {
          applyRemote(remote);
          if (!remote.game) setGame(G.emptyGame());
        } else {
          skipNextPush.current = true;
          setSubjects([]);
          setCards([]);
          setGame(G.emptyGame());
          updatedAtRef.current = 0;
        }
        await enterPerCardMode(user.uid, remote);
      } else {
        ownerUidRef.current = user.uid;
        // What the parent-doc push at the end of this branch must carry.
        // Deliberately NOT read from currentDataRef at push time: that ref is
        // refreshed by an effect, so between applyRemote below and the push it
        // can still hold this device's pre-sign-in state. On a browser that had
        // never synced, that state is empty — and pushing it would overwrite
        // the account's real subject tree with nothing.
        let subjectsToPush = currentDataRef.current.subjects;
        let gameToPush = currentDataRef.current.game;
        // Note what is NOT in this condition any more: `!perCardModeRef.current`.
        // Adopting the account's subject tree and game has nothing to do with
        // how its cards travel, and gating it on the mode meant that entering
        // per-card mode a moment earlier turned this whole branch off — the
        // device kept its empty subjects and pushed them up. The mode decides
        // where cards come from; the parent doc is adopted either way.
        if (remote && (remote.updatedAt || 0) > updatedAtRef.current && !(isEmptyPayload(remote) && (subjects.length > 0 || cards.length > 0))) {
          if (perCardModeRef.current) adoptParent(remote);
          else applyRemote(remote);
          // Mirror exactly what was just put into state.
          subjectsToPush = migrate.migrateSubjects(remote.subjects || []);
          if (remote.game) gameToPush = G.rollOver(G.normalizeGame(remote.game));
        } else if (remote && (remote.updatedAt || 0) <= updatedAtRef.current) {
          // This device's copy is the newer one. Nothing to adopt, but we have
          // read the account's document and know what's in it — which is the
          // question the push guard asks. Deliberately not set on the branch
          // above's failure modes: a client that was *supposed* to adopt and
          // somehow didn't must stay untrusted.
          parentAdoptedRef.current = true;
        }
        await enterPerCardMode(user.uid, remote);
        // Parent doc (subjects/game) still goes through the timestamp-guarded
        // push; cards now flow through the dirty-set push inside pushPerCard.
        await pushPerCard(user.uid, subjectsToPush, gameToPush);
      }
      setSyncState("synced");
    } catch (e) {
      setSyncState("error");
      if (e && e.code !== "USER_CANCELLED") {
        report("sync.signIn", e);
        setError(`Google sign-in failed: ${e && e.message ? e.message : e}`);
      }
    } finally {
      // Released only here: a sign-in that threw halfway must not leave the
      // restore effect permanently switched off for the rest of the session.
      signingInRef.current = false;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSync.signOut();
    } catch (e) {
      report("sync.signOut", e);
    }
    setGoogleUser(null);
    // Whatever is on screen now belongs to nobody in particular; the next
    // sign-in must earn the right to overwrite an account again.
    parentAdoptedRef.current = false;
    setSyncState("idle");
  };

  return {
    loaded,
    googleUser,
    syncState,
    setSyncState,
    currentDataRef,
    ownerUidRef,
    updatedAtRef,
    skipNextPush,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
