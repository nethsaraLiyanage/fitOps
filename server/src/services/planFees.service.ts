export type PaymentMethod = "Monthly" | "Annual";
export type PlanFees = Record<string, Record<PaymentMethod, number>>;

export const PLAN_FEES: PlanFees = {
  Basic: { Monthly: 3500, Annual: 38000 },
  Premium: { Monthly: 6500, Annual: 70000 },
};

export const feeFor = (plan: string, method: PaymentMethod): number => (PLAN_FEES[plan] ?? PLAN_FEES.Basic)[method];

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const currentPeriod = (method: PaymentMethod, from = new Date()) =>
  method === "Monthly" ? monthKey(from) : String(from.getFullYear());

export const todayISO = () => new Date().toISOString().slice(0, 10);
