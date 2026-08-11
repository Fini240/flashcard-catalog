import { initializeApp, getApps } from "firebase/app";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { FirebaseFirestore } from "@capacitor-firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoluLc4x34wKBlfunW3GnINnJXRtlVOUg",
  authDomain: "centering-timer-502020-h0.firebaseapp.com",
  projectId: "centering-timer-502020-h0",
  storageBucket: "centering-timer-502020-h0.firebasestorage.app",
  messagingSenderId: "387262316933",
  appId: "1:387262316933:web:f63390b41f0bab0c344ec",
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const docRef = (uid) => `users/${uid}`;

function toUser(user) {
  if (!user) return null;
  return { uid: user.uid, email: user.email, name: user.displayName };
}

export async function signIn() {
  const result = await FirebaseAuthentication.signInWithGoogle();
  const user = toUser(result.user);
  if (!user) throw new Error("Google sign-in did not return a user");
  return user;
}

export async function signOut() {
  await FirebaseAuthentication.signOut();
}

export async function getCurrentUser() {
  const { user } = await FirebaseAuthentication.getCurrentUser();
  return toUser(user);
}

export async function pullData(uid) {
  const { snapshot } = await FirebaseFirestore.getDocument({ reference: docRef(uid) });
  return snapshot.data;
}

export async function pushData(uid, payload) {
  await FirebaseFirestore.setDocument({ reference: docRef(uid), data: payload });
}

// Per-card mode's parent-doc write. Unlike pushData this MERGES, and the
// caller deliberately omits `cards` — so the pre-migration cards array on the
// parent document is left exactly where it is.
//
// This is not tidiness. A client running a build from before per-card sync
// reads its cards from that array, and a full overwrite that sets it to []
// tells such a client its catalog is empty — which it then adopts, wiping the
// device. That is precisely how a phone lost its cards on 2026-08-11 the
// moment a newer browser session signed into the same account. Merging leaves
// old clients on a stale-but-intact snapshot instead of an empty one, which is
// a degraded reading experience rather than data loss.
//
// It also keeps `cardsMigratedAt` from being dropped by a write that doesn't
// mention it. See the migration notes at the top of cardSync.js.
export async function pushParentData(uid, payload) {
  await FirebaseFirestore.setDocument({ reference: docRef(uid), data: payload, merge: true });
}

export async function listenToData(uid, callback) {
  return FirebaseFirestore.addDocumentSnapshotListener(
    { reference: docRef(uid) },
    (event, error) => {
      // Errors are handed to the caller, not dropped — a permission-denied
      // listener must not be indistinguishable from a quiet one.
      if (error) { callback(null, error); return; }
      callback(event ? event.snapshot.data : null, null);
    }
  );
}

export async function stopListening(callbackId) {
  await FirebaseFirestore.removeSnapshotListener({ callbackId });
}
