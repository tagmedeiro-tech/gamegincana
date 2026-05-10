import { createContext } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  revalidateCount: number;
  triggerRevalidate: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
