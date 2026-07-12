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

export async function listenToData(uid, callback) {
  return FirebaseFirestore.addDocumentSnapshotListener(
    { reference: docRef(uid) },
    (event, error) => {
      if (error) return;
      callback(event ? event.snapshot.data : null);
    }
  );
}

export async function stopListening(callbackId) {
  await FirebaseFirestore.removeSnapshotListener({ callbackId });
}
