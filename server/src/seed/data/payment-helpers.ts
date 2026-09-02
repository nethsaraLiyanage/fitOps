import { PaymentMethod, currentPeriod, feeFor } from "../../services/planFees.service.js";

export type PaymentStatus = "paid" | "pending" | "overdue";

export type SeedPayment = {
  period: string;
  amount: number;
  status: PaymentStatus;
  verified: boolean;
  paidOn: string | null;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function recentMonths(count = 3, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => monthKey(new Date(from.getFullYear(), from.getMonth() - i, 1)));
}

type PaymentSeed = { status: PaymentStatus; verified: boolean };

export const monthlyHistory = (plan: string, seeds: PaymentSeed[]): SeedPayment[] =>
  recentMonths(3).map((period, i) => ({
    period,
    amount: feeFor(plan, "Monthly"),
    status: seeds[i].status,
    verified: seeds[i].verified,
    paidOn: seeds[i].status === "paid" ? `${period}-05` : null,
  }));

export const annualHistory = (plan: string, seed: PaymentSeed): SeedPayment[] => {
  const period = currentPeriod("Annual");
  return [
    {
      period,
      amount: feeFor(plan, "Annual"),
      status: seed.status,
      verified: seed.verified,
      paidOn: seed.status === "paid" ? `${period}-01-10` : null,
    },
  ];
};

export type { PaymentMethod };
