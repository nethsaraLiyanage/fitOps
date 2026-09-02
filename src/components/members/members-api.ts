import { apiFetch } from "@/lib/api-client";
import { MemberFormValues } from "./AddMemberDialog";
import { Member } from "./member-data";
import { Payment, PlanFees } from "./payments";

export function fetchMembers(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<Member[]>(`/members${query}`);
}

export function fetchPlanFees() {
  return apiFetch<PlanFees>("/members/plan-fees");
}

export function createMemberRequest(values: MemberFormValues) {
  return apiFetch<Member>("/members", { method: "POST", body: values });
}

export function updatePaymentRequest(memberId: string, period: string, patch: Partial<Payment>) {
  return apiFetch<Member>(`/members/${memberId}/payments/${period}`, { method: "PATCH", body: patch });
}
