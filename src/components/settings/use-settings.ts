import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGymProfile,
  updateAccountRequest,
  updateGymProfileRequest,
  updatePasswordRequest,
} from "./settings-api";

export function useGymProfileQuery() {
  return useQuery({ queryKey: ["settings", "gym"], queryFn: fetchGymProfile });
}

export function useUpdateGymProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGymProfileRequest,
    onSuccess: (profile) => queryClient.setQueryData(["settings", "gym"], profile),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccountRequest,
    // AuthProvider mirrors ['auth','me'] into its user state, so this refreshes the header too.
    onSuccess: (user) => queryClient.setQueryData(["auth", "me"], user),
  });
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updatePasswordRequest });
}
