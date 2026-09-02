import { cn } from "@/lib/utils";

type Status =
  | "active"
  | "expired"
  | "warning"
  | "maintenance"
  | "broken"
  | "low"
  | "critical"
  | "working"
  | "paid"
  | "pending"
  | "overdue";

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: { label: "Active", className: "status-active" },
  working: { label: "Working", className: "status-active" },
  expired: { label: "Expired", className: "status-critical" },
  warning: { label: "Warning", className: "status-warning" },
  maintenance: { label: "Maintenance", className: "status-warning" },
  broken: { label: "Broken", className: "status-critical" },
  low: { label: "Low Stock", className: "status-warning" },
  critical: { label: "Critical", className: "status-critical" },
  paid: { label: "Paid", className: "status-active" },
  pending: { label: "Pending", className: "status-warning" },
  overdue: { label: "Overdue", className: "status-critical" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
