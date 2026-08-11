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
  const perCardModeRef = useRef(false);
  const cardMapRef = useRef({});
  const pushedRef = useRef({});
  const migratedAtRef = useRef(null);

  useEffect(() => {
    currentDataRef.current = { subjects, cards, game };
  }, [subjects, cards, game]);

  // Keep the card map in step with local edits. Newest timestamp wins per
  // card so a React state replace never resurrects a tombstone; cards missing
  // from state (just deleted in the UI) become tombstones here.
  useEffect(() => {
    const now = Date.now();
    const map = { ...cardMapRef.current };
    const inState = new Set();
    for (const c of cards) {
      inState.add(c.id);
      const stamped = c.updatedAt ? c : { ...c, updatedAt: now };
      const existing = map[c.id];
      if (!existing || (stamped.updatedAt || 0) >= (existing.deletedAt || existing.updatedAt || 0)) {
        map[c.id] = stamped;
      }
    }
    if (perCardModeRef.current) {
      // Tombstone whatever vanished from state — but only in per-card mode.
      // In legacy mode deletions ride the whole-doc push as before, and
      // pre-migration we can't tell "deleted" from "not loaded yet".
      for (const id of Object.keys(map)) {
        if (!inState.has(id) && !map[id].deletedAt) {
          map[id] = { ...map[id], deletedAt: now };
        }
      }
    } else {
      // Legacy mode: the map mirrors state exactly, deletions included —
      // whole-doc pushes carry the state array as-is.
      for (const id of Object.keys(map)) {
        if (!inState.has(id)) delete map[id];
      }
    }
    cardMapRef.current = map;
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
  useEffect(() => {
    firebaseSync.getCurrentUser().then((user) => {
      if (user) setGoogleUser(user);
    }).catch((e) => report("session.restore", e));
  }, []);

  const applyRemote = (remote) => {
    skipNextPush.current = true;
    setSubjects(migrate.migrateSubjects(remote.subjects || []));
    setCards(migrate.migrateCards(remote.cards || []));
    // A payload written by an older version of the app has no `game` at all.
    // Adopting it verbatim would silently reset a streak the user built here,
    // so in that case we keep whatever this device already has.
    if (remote.game) setGame(G.rollOver(G.normalizeGame(remote.game)));
    updatedAtRef.current = remote.updatedAt || Date.now();
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

  // In per-card mode the parent doc carries subjects/game only — an empty
  // cards array on it is normal, not a wipe. The guard above must not fire.
  const acceptRemoteParentIfNewer = (remote, user) => {
    if (perCardModeRef.current) {
      if (!remote || (remote.updatedAt || 0) <= updatedAtRef.current) return;
      skipNextPush.current = true;
      setSubjects(migrate.migrateSubjects(remote.subjects || []));
      if (remote.game) setGame(G.rollOver(G.normalizeGame(remote.game)));
      updatedAtRef.current = remote.updatedAt || Date.now();
      return;
    }
    acceptRemoteIfNewer(remote, user);
  };

  // Push only the cards that changed since their last successful push, then
  // the parent doc (subjects/game) without live cards. Tombstones past the
  // retention window are hard-deleted remotely and dropped locally.
  const pushPerCard = async (uid, subjectsPayload, gamePayload) => {
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
    if (perCardModeRef.current) {
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
  }, [googleUser, loaded]);

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
    // Reflect the merge immediately so the UI doesn't show a stale list.
    skipNextPush.current = true;
    setCards(migrate.migrateCards(cardSync.liveCards(cardMapRef.current)));
  };

  const handleSignIn = async () => {
    setSyncState("syncing");
    setError("");
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
        if (!perCardModeRef.current && remote && (remote.updatedAt || 0) > updatedAtRef.current && !(isEmptyPayload(remote) && (subjects.length > 0 || cards.length > 0))) {
          applyRemote(remote);
          // Mirror exactly what applyRemote just put into state.
          subjectsToPush = migrate.migrateSubjects(remote.subjects || []);
          if (remote.game) gameToPush = G.rollOver(G.normalizeGame(remote.game));
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
        setError(`Google sign-in failed: ${e && e.message ? e.message : e}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSync.signOut();
    } catch (e) {
      // ignore
    }
    setGoogleUser(null);
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
