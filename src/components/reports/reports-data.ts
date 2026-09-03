export type MemberTrendPoint = {
  month: string;
  /** Signups in that month. There is no churn tracking in this app, so none is reported. */
  new: number;
  /** Roster size at the end of that month. */
  total: number;
};

export type AttendanceTrendPoint = { week: string; avg: number };
export type WeekdayPoint = { day: string; checkins: number };
export type CategorySlice = { name: string; value: number };

export type ReportsSummary = {
  memberTrend: MemberTrendPoint[];
  attendanceTrend: AttendanceTrendPoint[];
  attendanceByWeekday: WeekdayPoint[];
  equipmentByCategory: CategorySlice[];
};

export type ExportKind = "members" | "attendance" | "equipment";

/** Cycled, so a gym with more categories than colours still renders. */
export const CATEGORY_COLORS = [
  "hsl(0, 74%, 50%)",
  "hsl(217, 91%, 60%)",
  "hsl(25, 95%, 53%)",
  "hsl(280, 65%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(48, 96%, 53%)",
];

export const colorForSlice = (index: number) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

/** Whole-percent share of the roster, for the pie legend. */
export function categoryShare(value: number, slices: CategorySlice[]): number {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function exportFilename(kind: ExportKind): string {
  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return `fitops-${kind}-${stamp}.csv`;
}
