import { apiFetch } from "@/lib/api-client";
import { AuthUser } from "@/components/auth/auth-context";
import { AccountValues, GymProfile, GymProfileValues, PasswordValues } from "./settings-data";

export function fetchGymProfile() {
  return apiFetch<GymProfile>("/settings/gym");
}

export function updateGymProfileRequest(values: GymProfileValues) {
  return apiFetch<GymProfile>("/settings/gym", { method: "PATCH", body: values });
}

export function updateAccountRequest(values: AccountValues) {
  return apiFetch<AuthUser>("/settings/account", { method: "PATCH", body: values });
}

export function updatePasswordRequest(values: PasswordValues) {
  return apiFetch<void>("/settings/account/password", { method: "PATCH", body: values });
}
