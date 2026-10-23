export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * GYM_TIMEZONE pins the process to the gym's zone where TZ can't be set — Vercel
 * runs functions in UTC and reserves TZ. Node re-reads TZ on assignment, so every
 * Date and Intl call after this follows it; it lives here so it runs before
 * GYM_TIMEZONE below is resolved and before any request does date bucketing.
 */
const configuredZone = process.env.GYM_TIMEZONE?.trim();
if (configuredZone) {
  if (!isValidTimeZone(configuredZone)) {
    throw new Error(`GYM_TIMEZONE "${configuredZone}" is not a valid IANA timezone, e.g. Asia/Colombo`);
  }
  process.env.TZ = configuredZone;
}

/**
 * The gym's timezone — the server is assumed to run in it. Every date-bucketing
 * aggregate (attendance "today", the peak-hour heatmap, the report trends) derives
 * its boundaries from this one value, so no two views can disagree about which day
 * a record belongs to. In a container this means TZ (or GYM_TIMEZONE) must be set.
 */
export const GYM_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function startOfDay(at: Date): Date {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfToday(): Date {
  return startOfDay(new Date());
}

export function startOfTomorrow(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export function daysAgo(days: number): Date {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}

/** Monday-first 0..6, matching every weekday grid in the UI. */
export function mondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** "2026-09-03" in the gym's timezone — the key shape used by the day-bucketed aggregates. */
export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
