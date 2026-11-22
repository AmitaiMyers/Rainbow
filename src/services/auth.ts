import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();

/** Installed PWAs (standalone) can't reliably open popups, so they use a full-page redirect. */
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

export async function signInWithGoogle(): Promise<void> {
  if (isStandalone()) {
    await signInWithRedirect(auth, provider);
    return;
  }
  await signInWithPopup(auth, provider);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export function subscribeToAuth(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, onChange);
}
