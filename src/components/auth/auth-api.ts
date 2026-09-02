import { apiFetch } from "@/lib/api-client";
import { AuthUser } from "./auth-context";

export function loginRequest(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function fetchMe() {
  return apiFetch<AuthUser>("/auth/me");
}
