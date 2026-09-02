import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Member } from "./member-data";
import { PlanFees, currentMonthLabel, formatAmount, formatPeriod, sumAmounts, unverifiedThisMonth } from "./payments";

/** Dashboard panel listing this month's payments that still need verifying. */
export function UnverifiedPaymentsCard({ members, planFees }: { members: Member[]; planFees: PlanFees }) {
  const navigate = useNavigate();
  const rows = unverifiedThisMonth(members, planFees);

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Unverified Payments</h3>
          <p className="text-xs text-muted-foreground">{currentMonthLabel()}</p>
        </div>
        {rows.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {rows.length} to verify
            <br />
            <span className="text-foreground font-medium">{formatAmount(sumAmounts(rows))}</span>
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 text-success" />
          Every payment for this month has been verified.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ member, payment }) => (
            <button
              key={member.id}
              type="button"
              onClick={() => navigate(`/members?member=${member.membershipId}`)}
              className="w-full flex items-center gap-3 text-left rounded-lg p-2 -mx-2 transition-colors hover:bg-secondary/60"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <ShieldAlert className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.paymentMethod} · {formatPeriod(payment.period)} · {formatAmount(payment.amount)}
                </p>
              </div>
              <StatusBadge status={payment.status} />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
