import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { tokenStorage } from '../api/tokenStorage';
import { AuthContext } from './useAuth';
import type { GetUserResponse, LoginRequest, RegisterRequest } from '../types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GetUserResponse | null>(null);
  // Without a stored token there is nothing to check, so no loading phase at all.
  // With one we don't know yet whether it is still valid.
  const [isLoading, setIsLoading] = useState(() => tokenStorage.getAccessToken() !== null);

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

  // initial session check: state is only set in the promise callbacks, never synchronously
  useEffect(() => {
    if (!tokenStorage.getAccessToken()) return;
    usersApi
      .getMe()
      .then(setUser)
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

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
