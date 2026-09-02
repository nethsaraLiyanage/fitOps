import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMemberRequest, fetchMembers, fetchPlanFees, updatePaymentRequest } from "./members-api";
import { Member } from "./member-data";
import { Payment, PlanFees, feeFor, todayISO } from "./payments";

export function useMembersQuery() {
  return useQuery({ queryKey: ["members"], queryFn: () => fetchMembers() });
}

export function usePlanFeesQuery() {
  return useQuery({ queryKey: ["members", "plan-fees"], queryFn: fetchPlanFees, staleTime: Infinity });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMemberRequest,
    onSuccess: (member) => {
      queryClient.setQueryData<Member[]>(["members"], (prev) => (prev ? [member, ...prev] : [member]));
    },
  });
}

/** Mirrors the server's updatePayment rule locally so the toggle/status edit feels instant. */
function applyPaymentPatch(member: Member, period: string, patch: Partial<Payment>, planFees: PlanFees): Member {
  const existing = member.payments.find((p) => p.period === period);
  const base: Payment = existing ?? {
    period,
    amount: feeFor(member.plan, member.paymentMethod, planFees),
    status: "pending",
    verified: false,
    paidOn: null,
  };
  const updated: Payment = { ...base, ...patch };

  if (patch.status && patch.status !== base.status) {
    updated.verified = false;
    updated.paidOn = patch.status === "paid" ? base.paidOn ?? todayISO() : null;
  }

  return {
    ...member,
    payments: existing ? member.payments.map((p) => (p.period === period ? updated : p)) : [updated, ...member.payments],
  };
}

export function useUpdatePayment(planFees: PlanFees | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, period, patch }: { memberId: string; period: string; patch: Partial<Payment> }) =>
      updatePaymentRequest(memberId, period, patch),
    onMutate: async ({ memberId, period, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["members"] });
      const previous = queryClient.getQueryData<Member[]>(["members"]);

      if (planFees) {
        queryClient.setQueryData<Member[]>(["members"], (prev) =>
          prev?.map((m) => (m.id === memberId ? applyPaymentPatch(m, period, patch, planFees) : m)),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["members"], context.previous);
    },
    onSuccess: (member) => {
      queryClient.setQueryData<Member[]>(["members"], (prev) => prev?.map((m) => (m.id === member.id ? member : m)));
    },
  });
}
