// ---------------------------------------------------------------------------
// The last thing standing between a confused client and someone's catalog.
//
// Every wipe this app has suffered had the same shape: a client holding an
// empty subject tree wrote it over an account that had one. The routes in were
// all different — a one-shot auth read, a ref that didn't re-run an effect, a
// migration racing a sign-in — and each was fixed on its own terms. This is
// the guard that doesn't care which route was taken.
//
// The first version of this file asked "has this session read the account
// yet?". That was too weak, and it failed within the hour: a client wiped
// earlier in the day had the empty tree in its own localStorage, so it *had*
// read the account — days ago, correctly, and then been corrupted. Worse, its
// clock kept ticking, so its emptiness always looked newer than the truth. No
// timestamp comparison can separate those two cases, because both are "local
// is newer".
//
// So the question is not when the client last read, or which side is newer.
// It is: **did a person empty this catalog, in this session, on this device?**
// Deleting your last subject sets that flag and syncs. Waking up holding
// nothing never does — and a client that has nothing to say is not allowed to
// say it over an account that does.
// ---------------------------------------------------------------------------

const len = (v) => (v || []).length;

// `emptiedLocally` — did the subject tree go from non-empty to empty in this
// session, by an edit made here (not by adopting a remote snapshot)?
export function refusesParentPush({ subjects, remote, emptiedLocally }) {
  if (len(subjects) > 0) return false;          // not replacing anything with nothing
  if (!remote || len(remote.subjects) === 0) return false; // nothing there to lose
  return !emptiedLocally;
}

// The legacy whole-document path can lose the subject tree, the cards array
// and the game in a single write, so it asks the same question about each of
// the two collections it carries.
export function refusesLegacyPush({ payload, remote, emptiedLocally, clearedCardsLocally }) {
  if (!remote) return false;
  const subjectsLost = len(payload && payload.subjects) === 0 && len(remote.subjects) > 0 && !emptiedLocally;
  const cardsLost = len(payload && payload.cards) === 0 && len(remote.cards) > 0 && !clearedCardsLocally;
  return subjectsLost || cardsLost;
}

// The mirror image, on the way in: this client is holding nothing and the
// server has a catalog. Take it, whatever the timestamps say — an empty
// local tree is never worth defending, and this is what lets a device that
// was corrupted earlier heal itself the moment it sees the truth.
export function shouldHealFromRemote({ subjects, remote, emptiedLocally }) {
  if (emptiedLocally) return false;
  if (len(subjects) > 0) return false;
  return !!remote && len(remote.subjects) > 0;
}
