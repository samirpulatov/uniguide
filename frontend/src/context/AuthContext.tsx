import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { tokenStorage } from '../api/tokenStorage';
import type { GetUserResponse, LoginRequest, RegisterRequest } from '../types';

interface AuthContextValue {
  user: GetUserResponse | null;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: GetUserResponse) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GetUserResponse | null>(null);
  // Starts true: on first load we don't know yet whether a stored token is still valid.
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const profile = await usersApi.getMe();
      setUser(profile);
    } catch {
      // Access token is missing/expired and the refresh (handled by the axios
      // interceptor) didn't save it — treat the session as gone.
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (request: LoginRequest) => {
    const tokens = await authApi.login(request);
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    await refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (request: RegisterRequest) => {
    const tokens = await authApi.register(request);
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
