/**
 * Attendance demo data. Historical records span eight weeks so the peak-hour
 * heatmap has something to show; today's records are fixed so the Attendance
 * page always demos both states (already checked out, and still in the gym).
 */

/** Deterministic PRNG — re-seeding the database reproduces the same demo history. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A typical gym rhythm: a morning rush, a quiet midday, a bigger evening peak. */
const HOUR_WEIGHTS: [hour: number, weight: number][] = [
  [5, 1], [6, 3], [7, 5], [8, 4], [9, 2], [10, 1], [11, 1],
  [12, 2], [13, 2], [16, 2], [17, 4], [18, 6], [19, 4], [20, 2],
];

/** Monday-first. Weekends are quieter apart from a late Saturday morning. */
const WEEKDAY_FACTOR = [1, 1, 1, 0.9, 0.8, 0.6, 0.35];

const HISTORY_WEEKS = 8;

export type SeedAttendanceRecord = {
  memberId: unknown;
  checkIn: Date;
  checkOut: Date | null;
};

export function buildSeedAttendance(memberIds: unknown[]): SeedAttendanceRecord[] {
  const random = mulberry32(20260903);
  const records: SeedAttendanceRecord[] = [];

  const midnightToday = new Date();
  midnightToday.setHours(0, 0, 0, 0);

  const completedSession = (day: Date, hour: number, memberId: unknown): SeedAttendanceRecord & { checkOut: Date } => {
    const checkIn = new Date(day);
    checkIn.setHours(hour, Math.floor(random() * 60), 0, 0);

    const checkOut = new Date(checkIn);
    checkOut.setMinutes(checkOut.getMinutes() + 45 + Math.floor(random() * 60));
    return { memberId, checkIn, checkOut };
  };

  // Completed history, oldest day first.
  for (let daysAgo = HISTORY_WEEKS * 7 - 1; daysAgo >= 1; daysAgo--) {
    const day = new Date(midnightToday);
    day.setDate(day.getDate() - daysAgo);
    const factor = WEEKDAY_FACTOR[(day.getDay() + 6) % 7];

    for (const [hour, weight] of HOUR_WEIGHTS) {
      const expected = weight * factor * 0.4;
      const count = Math.floor(expected + random());

      for (let i = 0; i < count; i++) {
        records.push(completedSession(day, hour, memberIds[Math.floor(random() * memberIds.length)]));
      }
    }
  }

  // Today: morning slots that have already finished by the time the seed runs, so
  // nothing lands in the future or before the gym opens, whatever hour it runs at.
  const now = Date.now();
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000);

  [6, 7, 8].forEach((hour, i) => {
    if (!memberIds[i]) return;

    const session = completedSession(midnightToday, hour, memberIds[i]);
    if (session.checkOut.getTime() <= now) records.push(session);
  });

  // Two members are still training, so the page demos the "In gym" state too.
  [75, 30].forEach((inMinutes, i) => {
    const memberId = memberIds[3 + i];
    if (!memberId) return;
    records.push({ memberId, checkIn: minutesAgo(inMinutes), checkOut: null });
  });

  return records;
}
