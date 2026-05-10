import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // IDE Cache Buster

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
