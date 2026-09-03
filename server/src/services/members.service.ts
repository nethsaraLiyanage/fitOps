import { nextSequence } from "../models/Counter.js";
import { Member } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { CreateMemberInput, UpdatePaymentInput } from "../schemas/member.schema.js";
import { PLAN_FEES, currentPeriod, feeFor, todayISO } from "./planFees.service.js";
import { logActivity } from "./activity.service.js";

const toClientMember = (doc: any) => ({
  id: String(doc._id),
  membershipId: doc.membershipId,
  name: doc.name,
  nic: doc.nic,
  email: doc.email,
  phone: doc.phone,
  status: doc.status,
  joined: doc.joined,
  plan: doc.plan,
  paymentMethod: doc.paymentMethod,
  payments: doc.payments.map((p: any) => ({
    period: p.period,
    amount: p.amount,
    status: p.status,
    verified: p.verified,
    paidOn: p.paidOn,
  })),
});

export async function listMembers(search?: string) {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { nic: { $regex: search, $options: "i" } },
          { membershipId: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const members = await Member.find(query).sort({ createdAt: -1 });
  return members.map(toClientMember);
}

export async function createMember(input: CreateMemberInput, actorId?: string) {
  const seq = await nextSequence("member");
  const membershipId = `GYM-${String(seq).padStart(4, "0")}`;

  const firstPayment = {
    period: currentPeriod(input.paymentMethod),
    amount: feeFor(input.plan, input.paymentMethod),
    status: "pending" as const,
    verified: false,
    paidOn: null,
  };

  const member = await Member.create({ ...input, membershipId, payments: [firstPayment] });
  await logActivity("member.joined", `${member.name} joined as a new member`, actorId);
  return toClientMember(member);
}

/**
 * Manual payment edit. A period with no record yet (an untouched month in the
 * three-month history) gets one created on the fly. Changing the status drops
 * the verification, so an edited payment has to be verified again.
 */
export async function updatePayment(memberId: string, period: string, patch: UpdatePaymentInput, actorId?: string) {
  const member = await Member.findById(memberId);
  if (!member) throw ApiError.notFound("Member not found");

  const existing = member.payments.find((p) => p.period === period);
  const base = existing
    ? { period: existing.period, amount: existing.amount, status: existing.status, verified: existing.verified, paidOn: existing.paidOn }
    : { period, amount: feeFor(member.plan, member.paymentMethod), status: "pending" as const, verified: false, paidOn: null as string | null };

  const updated = { ...base, ...patch };

  if (patch.status && patch.status !== base.status) {
    updated.verified = false;
    updated.paidOn = patch.status === "paid" ? (base.paidOn ?? todayISO()) : null;
  }

  if (existing) {
    existing.period = updated.period;
    existing.amount = updated.amount;
    existing.status = updated.status;
    existing.verified = updated.verified;
    existing.paidOn = updated.paidOn;
  } else {
    member.payments.push(updated);
  }

  await member.save();

  const detail = updated.verified !== base.verified && updated.status === base.status
    ? `${updated.verified ? "verified" : "unverified"}`
    : `marked ${updated.status}`;
  await logActivity("payment.updated", `${member.name}'s ${period} payment ${detail}`, actorId);

  return toClientMember(member);
}

export function getPlanFeesTable() {
  return PLAN_FEES;
}
