import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  /** Resolves to false when the credentials do not match a known account. */
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
