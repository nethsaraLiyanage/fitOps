export type AttendanceRecord = {
  id: string;
  memberId: string;
  memberName: string;
  membershipId: string | null;
  /** ISO timestamps — the server sends instants, this module owns the display formatting. */
  checkIn: string;
  checkOut: string | null;
};

/** One non-empty bucket of the peak-hour aggregation. `weekday` is Monday-first 0..6. */
export type HeatmapCell = {
  weekday: number;
  hour: number;
  count: number;
};

export type HeatmapRow = {
  hour: number;
  label: string;
  counts: number[];
};

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
}

/** Time spent in the gym, or "In gym" while the member hasn't checked out yet. */
export function formatDuration(record: AttendanceRecord): string {
  if (!record.checkOut) return "In gym";

  const elapsedMs = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
  const minutes = Math.max(0, Math.round(elapsedMs / 60000));
  const hours = Math.floor(minutes / 60);

  return hours === 0 ? `${minutes}m` : `${hours}h ${minutes % 60}m`;
}

/** Pivots the API's sparse cells into one row per hour that saw any check-ins, Monday-first columns. */
export function buildHeatmapRows(cells: HeatmapCell[]): HeatmapRow[] {
  const countsByHour = new Map<number, number[]>();

  for (const cell of cells) {
    if (cell.weekday < 0 || cell.weekday > 6) continue;
    if (!countsByHour.has(cell.hour)) countsByHour.set(cell.hour, Array(7).fill(0));
    countsByHour.get(cell.hour)[cell.weekday] += cell.count;
  }

  return [...countsByHour.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, counts]) => ({ hour, label: formatHour(hour), counts }));
}

export function busiestCount(rows: HeatmapRow[]): number {
  return rows.reduce((max, row) => Math.max(max, ...row.counts), 0);
}

/** Shades relative to the busiest bucket, so the scale adapts to however busy the gym actually is. */
export function heatColor(count: number, busiest: number): string {
  if (count === 0 || busiest === 0) return "bg-secondary";

  const ratio = count / busiest;
  if (ratio <= 0.2) return "bg-primary/20";
  if (ratio <= 0.4) return "bg-primary/40";
  if (ratio <= 0.6) return "bg-primary/60";
  if (ratio <= 0.8) return "bg-primary/80";
  return "bg-primary";
}

export const HEAT_LEGEND = ["bg-secondary", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80", "bg-primary"];
