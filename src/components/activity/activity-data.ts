import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  LucideIcon,
  Package,
  UserCheck,
  UserPlus,
  Wrench,
} from "lucide-react";

export type ActivityEntry = {
  id: string;
  type: string;
  text: string;
  createdAt: string;
};

type ActivityStyle = { icon: LucideIcon; color: string };

const STYLES: Record<string, ActivityStyle> = {
  "member.joined": { icon: UserPlus, color: "text-success" },
  "payment.updated": { icon: CreditCard, color: "text-info" },
  "equipment.status_changed": { icon: Dumbbell, color: "text-warning" },
  "equipment.maintenance_logged": { icon: Wrench, color: "text-warning" },
  "inventory.restocked": { icon: Package, color: "text-info" },
  "inventory.low_stock": { icon: AlertTriangle, color: "text-destructive" },
  "classes.class_scheduled": { icon: CalendarClock, color: "text-primary" },
  "classes.session_completed": { icon: CheckCircle2, color: "text-success" },
  "attendance.checked_in": { icon: UserCheck, color: "text-primary" },
};

/** Unknown types still render — a new server-side activity type must not blank the feed. */
const FALLBACK: ActivityStyle = { icon: Activity, color: "text-muted-foreground" };

export const activityStyle = (type: string): ActivityStyle => STYLES[type] ?? FALLBACK;

export function relativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
