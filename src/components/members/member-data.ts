import { Payment, PaymentMethod, PaymentStatus, PlanFees, currentPeriod, feeFor, recentMonths } from "./payments";

export type Member = {
  id: string;
  membershipId: string;
  name: string;
  nic: string;
  email: string;
  phone: string;
  status: "active" | "expired";
  joined: string;
  plan: string;
  paymentMethod: PaymentMethod;
  payments: Payment[];
};

/**
 * Test-only fixture data — production data comes from GET /api/members.
 * Mirrors server/src/services/planFees.service.ts so fixtures stay in sync.
 */
export const TEST_PLAN_FEES: PlanFees = {
  Basic: { Monthly: 3500, Annual: 38000 },
  Premium: { Monthly: 6500, Annual: 70000 },
};

type PaymentSeed = { status: PaymentStatus; verified: boolean };

/** Demo history for the past three months, newest first. */
const monthlyHistory = (plan: string, seeds: PaymentSeed[]): Payment[] =>
  recentMonths().map((period, i) => ({
    period,
    amount: feeFor(plan, "Monthly", TEST_PLAN_FEES),
    status: seeds[i].status,
    verified: seeds[i].verified,
    paidOn: seeds[i].status === "paid" ? `${period}-05` : null,
  }));

const annualHistory = (plan: string, seed: PaymentSeed): Payment[] => {
  const period = currentPeriod("Annual");
  return [
    {
      period,
      amount: feeFor(plan, "Annual", TEST_PLAN_FEES),
      status: seed.status,
      verified: seed.verified,
      paidOn: seed.status === "paid" ? `${period}-01-10` : null,
    },
  ];
};

export const initialMembers: Member[] = [
  { id: "1", membershipId: "GYM-0001", name: "Sarah Connor", nic: "199254801234", email: "sarah@example.com", phone: "+1 555-0101", status: "active", joined: "2024-01-15", plan: "Premium", paymentMethod: "Monthly", payments: monthlyHistory("Premium", [{ status: "pending", verified: false }, { status: "paid", verified: true }, { status: "paid", verified: true }]) },
  { id: "2", membershipId: "GYM-0002", name: "John Doe", nic: "198812503456", email: "john@example.com", phone: "+1 555-0102", status: "active", joined: "2024-02-20", plan: "Basic", paymentMethod: "Monthly", payments: monthlyHistory("Basic", [{ status: "paid", verified: false }, { status: "paid", verified: true }, { status: "paid", verified: true }]) },
  { id: "3", membershipId: "GYM-0003", name: "Mike Wilson", nic: "902345678V", email: "mike@example.com", phone: "+1 555-0103", status: "expired", joined: "2023-11-10", plan: "Premium", paymentMethod: "Monthly", payments: monthlyHistory("Premium", [{ status: "overdue", verified: false }, { status: "overdue", verified: false }, { status: "paid", verified: true }]) },
  { id: "4", membershipId: "GYM-0004", name: "Emily Chen", nic: "199578902345", email: "emily@example.com", phone: "+1 555-0104", status: "active", joined: "2024-03-01", plan: "Basic", paymentMethod: "Annual", payments: annualHistory("Basic", { status: "paid", verified: true }) },
  { id: "5", membershipId: "GYM-0005", name: "Alex Rivera", nic: "200019604567", email: "alex@example.com", phone: "+1 555-0105", status: "active", joined: "2024-01-28", plan: "Premium", paymentMethod: "Annual", payments: annualHistory("Premium", { status: "paid", verified: false }) },
  { id: "6", membershipId: "GYM-0006", name: "Lisa Park", nic: "947812345V", email: "lisa@example.com", phone: "+1 555-0106", status: "expired", joined: "2023-09-15", plan: "Basic", paymentMethod: "Monthly", payments: monthlyHistory("Basic", [{ status: "overdue", verified: false }, { status: "pending", verified: false }, { status: "paid", verified: true }]) },
  { id: "7", membershipId: "GYM-0007", name: "David Kim", nic: "199103705678", email: "david@example.com", phone: "+1 555-0107", status: "active", joined: "2024-04-05", plan: "Premium", paymentMethod: "Monthly", payments: monthlyHistory("Premium", [{ status: "paid", verified: true }, { status: "paid", verified: true }, { status: "paid", verified: false }]) },
  { id: "8", membershipId: "GYM-0008", name: "Rachel Green", nic: "965423781V", email: "rachel@example.com", phone: "+1 555-0108", status: "active", joined: "2024-02-14", plan: "Basic", paymentMethod: "Annual", payments: annualHistory("Basic", { status: "pending", verified: false }) },
];
