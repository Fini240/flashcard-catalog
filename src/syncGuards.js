// ---------------------------------------------------------------------------
// The last thing standing between a confused client and someone's catalog.
//
// Every wipe this app has suffered had the same shape: a client that had not
// yet read the account's data wrote its own empty state over it. The specific
// route in was different every time — a one-shot auth read, a ref that didn't
// re-run an effect, a migration racing a sign-in — and each was fixed on its
// own terms. This is the guard that doesn't care which route was taken.
//
// The rule: a session may only push a parent document with fewer subjects
// than the server already has once it has actually adopted the server's
// state. Deleting your own subjects stays possible — by then the session has
// adopted, so the guard is silent. What becomes impossible is a client that
// has never seen your catalog replacing it with nothing.
// ---------------------------------------------------------------------------

// `adopted` — has this session taken the account's remote parent state into
// its own state at least once (applyRemote, or the per-card parent listener)?
// `remote` — the parent document as it is on the server right now, or null.
export function refusesParentPush({ subjects, adopted, remote }) {
  if (adopted) return false;
  const mine = (subjects || []).length;
  const theirs = ((remote && remote.subjects) || []).length;
  // Nothing on the server to lose, or we're not shrinking it: let it through.
  if (theirs === 0 || mine >= theirs) return false;
  return true;
}

// The same question for the legacy whole-document path, which can also lose
// the cards array and the game in one write.
export function refusesLegacyPush({ payload, adopted, remote }) {
  if (adopted) return false;
  if (!remote) return false;
  const emptyHere =
    ((payload && payload.subjects) || []).length === 0 &&
    ((payload && payload.cards) || []).length === 0;
  const somethingThere =
    ((remote.subjects) || []).length > 0 || ((remote.cards) || []).length > 0;
  return emptyHere && somethingThere;
}
