import type { User } from 'firebase/auth';
import { useState } from 'react';
import { errorMessage } from '../lib/asyncState';
import { signInWithGoogle, signOut } from '../services/auth';

export function AuthButton({ user }: { user: User | null | undefined }) {
  const [error, setError] = useState<string | null>(null);
  if (user === undefined) return null;

  if (user === null) {
    const onSignIn = () => {
      setError(null);
      signInWithGoogle().catch((e: unknown) => setError(errorMessage(e)));
    };
    return (
      <div className="auth">
        <button className="button small" onClick={onSignIn}>Sign in with Google</button>
        {error !== null && <span className="error small">{error}</span>}
      </div>
    );
  }

  return (
    <div className="auth">
      {user.photoURL !== null && <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
      <button className="button small ghost" onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}
