import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, clearToken, getToken, setToken } from "@/lib/api-client";
import { AuthContext, AuthUser } from "./auth-context";
import { fetchMe, loginRequest } from "./auth-api";

const SESSION_KEY = "fitops.session";

const readSession = (): AuthUser | null => {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
};

const persistSession = (user: AuthUser) => {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // A blocked localStorage only costs persistence across reloads.
  }
};

const clearSession = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);
  /** Gates the /auth/me query: true while a token should be considered live, false once logged out. */
  const [hasSession, setHasSession] = useState(() => !!getToken());
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    enabled: hasSession,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (meQuery.status === "success") {
      setUser(meQuery.data);
      persistSession(meQuery.data);
    }
  }, [meQuery.status, meQuery.data]);

  useEffect(() => {
    if (meQuery.status === "error" && meQuery.error instanceof ApiError && meQuery.error.status === 401) {
      setUser(null);
      setHasSession(false);
      clearToken();
      clearSession();
    }
  }, [meQuery.status, meQuery.error]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { token, user: loggedInUser } = await loginRequest(email.trim(), password);
        setToken(token);
        persistSession(loggedInUser);
        setUser(loggedInUser);
        setHasSession(true);
        queryClient.setQueryData(["auth", "me"], loggedInUser);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return false;
        throw err;
      }
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    setUser(null);
    setHasSession(false);
    clearToken();
    clearSession();
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
  }, [queryClient]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
