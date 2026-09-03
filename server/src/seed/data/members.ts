import { annualHistory, monthlyHistory, PaymentMethod } from "./payment-helpers.js";

/**
 * Join dates are relative to the seed run, not fixed calendar dates, so the
 * membership trend report always has signups inside its six-month window.
 * The offsets preserve the original demo data's ordering and month-gaps.
 * `day` stays <= 28 so every month can hold it.
 */
function joinedMonthsAgo(monthsAgo: number, day: number): string {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Ported from the frontend's member-data.ts initialMembers. */
export const seedMembers = [
  { membershipId: "GYM-0001", name: "Sarah Connor", nic: "199254801234", email: "sarah@example.com", phone: "+1 555-0101", status: "active" as const, joined: joinedMonthsAgo(4, 15), plan: "Premium", paymentMethod: "Monthly" as PaymentMethod, payments: monthlyHistory("Premium", [{ status: "pending", verified: false }, { status: "paid", verified: true }, { status: "paid", verified: true }]) },
  { membershipId: "GYM-0002", name: "John Doe", nic: "198812503456", email: "john@example.com", phone: "+1 555-0102", status: "active" as const, joined: joinedMonthsAgo(3, 20), plan: "Basic", paymentMethod: "Monthly" as PaymentMethod, payments: monthlyHistory("Basic", [{ status: "paid", verified: false }, { status: "paid", verified: true }, { status: "paid", verified: true }]) },
  { membershipId: "GYM-0003", name: "Mike Wilson", nic: "902345678V", email: "mike@example.com", phone: "+1 555-0103", status: "expired" as const, joined: joinedMonthsAgo(6, 10), plan: "Premium", paymentMethod: "Monthly" as PaymentMethod, payments: monthlyHistory("Premium", [{ status: "overdue", verified: false }, { status: "overdue", verified: false }, { status: "paid", verified: true }]) },
  { membershipId: "GYM-0004", name: "Emily Chen", nic: "199578902345", email: "emily@example.com", phone: "+1 555-0104", status: "active" as const, joined: joinedMonthsAgo(2, 1), plan: "Basic", paymentMethod: "Annual" as PaymentMethod, payments: annualHistory("Basic", { status: "paid", verified: true }) },
  { membershipId: "GYM-0005", name: "Alex Rivera", nic: "200019604567", email: "alex@example.com", phone: "+1 555-0105", status: "active" as const, joined: joinedMonthsAgo(4, 28), plan: "Premium", paymentMethod: "Annual" as PaymentMethod, payments: annualHistory("Premium", { status: "paid", verified: false }) },
  { membershipId: "GYM-0006", name: "Lisa Park", nic: "947812345V", email: "lisa@example.com", phone: "+1 555-0106", status: "expired" as const, joined: joinedMonthsAgo(8, 15), plan: "Basic", paymentMethod: "Monthly" as PaymentMethod, payments: monthlyHistory("Basic", [{ status: "overdue", verified: false }, { status: "pending", verified: false }, { status: "paid", verified: true }]) },
  { membershipId: "GYM-0007", name: "David Kim", nic: "199103705678", email: "david@example.com", phone: "+1 555-0107", status: "active" as const, joined: joinedMonthsAgo(1, 5), plan: "Premium", paymentMethod: "Monthly" as PaymentMethod, payments: monthlyHistory("Premium", [{ status: "paid", verified: true }, { status: "paid", verified: true }, { status: "paid", verified: false }]) },
  { membershipId: "GYM-0008", name: "Rachel Green", nic: "965423781V", email: "rachel@example.com", phone: "+1 555-0108", status: "active" as const, joined: joinedMonthsAgo(3, 14), plan: "Basic", paymentMethod: "Annual" as PaymentMethod, payments: annualHistory("Basic", { status: "pending", verified: false }) },
];
