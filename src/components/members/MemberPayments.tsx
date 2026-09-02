import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  MONTHLY_HISTORY_LENGTH,
  PAYMENT_STATUSES,
  Payment,
  PayingMember,
  PaymentStatus,
  PlanFees,
  formatAmount,
  formatPeriod,
  visiblePayments,
} from "./payments";

interface MemberPaymentsProps {
  member: PayingMember;
  planFees: PlanFees;
  onUpdate: (period: string, patch: Partial<Payment>) => void;
}

export function MemberPayments({ member, planFees, onUpdate }: MemberPaymentsProps) {
  const payments = visiblePayments(member, planFees);
  const monthly = member.paymentMethod === "Monthly";

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Payment Method</p>
          <p className="text-sm font-medium text-foreground">{member.paymentMethod}</p>
        </div>
        <p className="text-xs text-muted-foreground text-right max-w-[60%]">
          {monthly
            ? `Showing the past ${MONTHLY_HISTORY_LENGTH} months`
            : "Billed once a year — monthly history applies to monthly members only"}
        </p>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.period} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{formatPeriod(payment.period)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(payment.amount)} · {payment.paidOn ? `Paid ${payment.paidOn}` : "No payment recorded"}
                </p>
              </div>
              <StatusBadge status={payment.status} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={payment.status}
                onValueChange={(value) => onUpdate(payment.period, { status: value as PaymentStatus })}
              >
                <SelectTrigger
                  className="bg-secondary border-border h-9 w-full sm:w-40 capitalize"
                  aria-label={`Payment status for ${formatPeriod(payment.period)}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                {payment.verified ? (
                  <ShieldCheck className="h-4 w-4 text-primary" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={payment.verified ? "text-foreground" : "text-muted-foreground"}>
                  {payment.verified ? "Verified" : "Not verified"}
                </span>
                <Switch
                  checked={payment.verified}
                  onCheckedChange={(verified) => onUpdate(payment.period, { verified })}
                  aria-label={`Mark ${formatPeriod(payment.period)} payment as verified`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Changing a payment status clears its verification, so every payment has to be verified again after it is edited.
      </p>
    </div>
  );
}
