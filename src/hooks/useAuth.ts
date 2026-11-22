import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { subscribeToAuth } from '../services/auth';

/** `undefined` while Firebase restores the session, then the user or null. */
export function useAuth(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => subscribeToAuth(setUser), []);
  return user;
}
