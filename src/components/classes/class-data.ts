import { ClassFormValues, DAYS } from "./AddClassDialog";

export type TrainingClass = ClassFormValues & { id: string; booked: number };

export type SessionStatus = "Completed" | "Scheduled" | "Cancelled";

export type ClassSession = {
  id: string;
  /** Null for ad-hoc sessions not tied to any recurring class. */
  classId: string | null;
  date: string;
  title: string;
  discipline: string;
  coach: string;
  attended: number;
  capacity: number;
  rounds: number;
  status: SessionStatus;
};

/** Curated presets for the discipline dropdown — the field itself accepts any string via "Other". */
export const DISCIPLINE_PRESETS = [
  "Muay Thai",
  "Kickboxing",
  "Boxing",
  "Karate",
  "Taekwondo",
  "Kung Fu",
  "Judo",
  "Brazilian Jiu-Jitsu",
  "Krav Maga",
  "MMA",
] as const;

export const levelStyles: Record<string, string> = {
  Beginner: "bg-primary/15 text-primary border-primary/30",
  Intermediate: "bg-info/15 text-info border-info/30",
  Advanced: "bg-warning/15 text-warning border-warning/30",
  Sparring: "bg-destructive/15 text-destructive border-destructive/30",
};

export const statusStyles: Record<SessionStatus, string> = {
  Completed: "status-active",
  Scheduled: "bg-info/15 text-info",
  Cancelled: "status-critical",
};

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fmt(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** DAYS starts on Monday, getDay() starts on Sunday. */
export const todayKey = (from = new Date()) => DAYS[(from.getDay() + 6) % 7];

export const todayDate = (from = new Date()) =>
  `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;

export type TodaySession = {
  key: string;
  title: string;
  discipline: string;
  coach: string;
  startTime: string | null;
  durationMin: number | null;
  ring: string | null;
  level: string | null;
  booked: number;
  capacity: number;
  status: SessionStatus;
};

/**
 * What is on the schedule today: this weekday's recurring classes, plus any
 * logged session dated today that no recurring class covers (a one-off addition).
 */
export function sessionsToday(classes: TrainingClass[], sessions: ClassSession[], from = new Date()): TodaySession[] {
  const day = todayKey(from);
  const date = todayDate(from);
  const logged = sessions.filter((s) => s.date === date);

  const fromClasses: TodaySession[] = classes
    .filter((c) => c.day === day)
    .map((c) => {
      const log = logged.find((s) => s.classId === c.id);
      return {
        key: `class-${c.id}`,
        title: c.title,
        discipline: c.discipline,
        coach: c.coach,
        startTime: c.startTime,
        durationMin: c.durationMin,
        ring: c.ring,
        level: c.level,
        booked: log?.status === "Completed" ? log.attended : c.booked,
        capacity: c.capacity,
        status: log?.status ?? "Scheduled",
      };
    })
    .sort((a, b) => toMinutes(a.startTime!) - toMinutes(b.startTime!));

  const covered = new Set(classes.filter((c) => c.day === day).map((c) => c.id));
  const fromLog: TodaySession[] = logged
    .filter((s) => !s.classId || !covered.has(s.classId))
    .map((s) => ({
      key: `session-${s.id}`,
      title: s.title,
      discipline: s.discipline,
      coach: s.coach,
      startTime: null,
      durationMin: null,
      ring: null,
      level: null,
      booked: s.attended,
      capacity: s.capacity,
      status: s.status,
    }));

  return [...fromClasses, ...fromLog];
}

/**
 * Test-only fixtures — production data comes from GET /api/classes and
 * GET /api/classes/sessions.
 */
export const initialClasses: TrainingClass[] = [
  { id: "1", title: "Fundamentals", discipline: "Muay Thai", coach: "Kru Somchai", day: "Mon", startTime: "07:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Ring A", booked: 16 },
  { id: "2", title: "Pad Work", discipline: "Muay Thai", coach: "Kru Anan", day: "Mon", startTime: "18:00", durationMin: 90, level: "Intermediate", capacity: 18, ring: "Ring B", booked: 18 },
  { id: "3", title: "Clinch & Knees", discipline: "Muay Thai", coach: "Kru Somchai", day: "Tue", startTime: "19:00", durationMin: 60, level: "Advanced", capacity: 14, ring: "Ring A", booked: 11 },
  { id: "4", title: "Fundamentals", discipline: "Kickboxing", coach: "Coach Mia", day: "Wed", startTime: "07:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Ring A", booked: 13 },
  { id: "5", title: "Sparring Night", discipline: "Muay Thai", coach: "Kru Anan", day: "Thu", startTime: "19:00", durationMin: 90, level: "Sparring", capacity: 12, ring: "Ring B", booked: 12 },
  { id: "6", title: "Conditioning", discipline: "Boxing", coach: "Coach Mia", day: "Fri", startTime: "18:00", durationMin: 45, level: "Intermediate", capacity: 24, ring: "Mat Area", booked: 19 },
  { id: "7", title: "Open Mat", discipline: "Brazilian Jiu-Jitsu", coach: "Kru Somchai", day: "Sat", startTime: "10:00", durationMin: 120, level: "Intermediate", capacity: 30, ring: "Ring A", booked: 22 },
  { id: "8", title: "Evening Technique", discipline: "Taekwondo", coach: "Coach Mia", day: "Wed", startTime: "18:00", durationMin: 60, level: "Intermediate", capacity: 18, ring: "Ring B", booked: 15 },
  { id: "9", title: "Sunday Drills", discipline: "Kung Fu", coach: "Kru Anan", day: "Sun", startTime: "09:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Mat Area", booked: 9 },
];

export const initialSessions: ClassSession[] = [
  { id: "1", classId: "2", date: "2026-07-28", title: "Pad Work", discipline: "Muay Thai", coach: "Kru Anan", attended: 17, capacity: 18, rounds: 12, status: "Completed" },
  { id: "2", classId: "1", date: "2026-07-28", title: "Fundamentals", discipline: "Muay Thai", coach: "Kru Somchai", attended: 14, capacity: 20, rounds: 8, status: "Completed" },
  { id: "3", classId: "3", date: "2026-07-27", title: "Clinch & Knees", discipline: "Muay Thai", coach: "Kru Somchai", attended: 10, capacity: 14, rounds: 10, status: "Completed" },
  { id: "4", classId: "5", date: "2026-07-26", title: "Sparring Night", discipline: "Muay Thai", coach: "Kru Anan", attended: 0, capacity: 12, rounds: 0, status: "Cancelled" },
  { id: "5", classId: "6", date: "2026-07-29", title: "Conditioning", discipline: "Boxing", coach: "Coach Mia", attended: 0, capacity: 24, rounds: 0, status: "Scheduled" },
];
