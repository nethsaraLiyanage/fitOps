export type PaymentMethod = "Monthly" | "Annual";
export type PaymentStatus = "paid" | "pending" | "overdue";

export type Payment = {
  /** "2026-07" for monthly plans, "2026" for annual ones. */
  period: string;
  amount: number;
  status: PaymentStatus;
  verified: boolean;
  paidOn: string | null;
};

export type PayingMember = {
  plan: string;
  paymentMethod: PaymentMethod;
  payments: Payment[];
};

/** The plan fee table, as served by GET /api/members/plan-fees. */
export type PlanFees = Record<string, Record<PaymentMethod, number>>;

export const PAYMENT_METHODS: PaymentMethod[] = ["Monthly", "Annual"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "pending", "overdue"];

/** Monthly plans show this many past periods, newest first. */
export const MONTHLY_HISTORY_LENGTH = 3;

export const feeFor = (plan: string, method: PaymentMethod, planFees: PlanFees) =>
  (planFees[plan] ?? planFees.Basic)[method];

export const todayISO = () => new Date().toISOString().slice(0, 10);

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** The last N month keys, newest first — e.g. ["2026-07", "2026-06", "2026-05"]. */
export function recentMonths(count = MONTHLY_HISTORY_LENGTH, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => monthKey(new Date(from.getFullYear(), from.getMonth() - i, 1)));
}

export const currentPeriod = (method: PaymentMethod, from = new Date()) =>
  method === "Monthly" ? monthKey(from) : String(from.getFullYear());

export function formatPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!month) return String(year);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export const formatAmount = (amount: number) => `Rs ${amount.toLocaleString()}`;

/**
 * The payment rows to show for a member: the past three months for monthly
 * plans, the current year for annual ones. Periods with no record yet show up
 * as unpaid placeholders so they can still be updated and verified.
 */
export function visiblePayments(member: PayingMember, planFees: PlanFees, from = new Date()): Payment[] {
  const periods =
    member.paymentMethod === "Monthly"
      ? recentMonths(MONTHLY_HISTORY_LENGTH, from)
      : [currentPeriod(member.paymentMethod, from)];

  return periods.map(
    (period) =>
      member.payments.find((p) => p.period === period) ?? {
        period,
        amount: feeFor(member.plan, member.paymentMethod, planFees),
        status: "pending" as const,
        verified: false,
        paidOn: null,
      },
  );
}

/** The record covering the period the member is currently being billed for. */
export const currentPayment = (member: PayingMember, planFees: PlanFees, from = new Date()) =>
  visiblePayments(member, planFees, from)[0];

/**
 * Payments covering the current month that nobody has verified yet — the
 * month's record for monthly members, the year's record for annual ones.
 */
export function unverifiedThisMonth<T extends PayingMember>(members: T[], planFees: PlanFees, from = new Date()) {
  return members
    .map((member) => ({ member, payment: currentPayment(member, planFees, from) }))
    .filter(({ payment }) => !payment.verified);
}

export const sumAmounts = (rows: { payment: Payment }[]) => rows.reduce((total, row) => total + row.payment.amount, 0);

export const currentMonthLabel = (from = new Date()) => formatPeriod(currentPeriod("Monthly", from));
