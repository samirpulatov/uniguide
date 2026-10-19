import { createContext, useContext } from 'react';
import type { GetUserResponse, LoginRequest, RegisterRequest } from '../types';

// Lives apart from AuthProvider: a .tsx file that exports a component should export nothing else,
// otherwise Vite's fast refresh has to reload the whole page on every edit.
export interface AuthContextValue {
  user: GetUserResponse | null;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: GetUserResponse) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
