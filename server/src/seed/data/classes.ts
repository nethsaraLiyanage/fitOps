/** Ported from the frontend's muaythai-data.ts initialClasses/initialSessions, now multi-discipline. */
export const seedClasses = [
  { key: "fundamentals-mon", title: "Fundamentals", discipline: "Muay Thai", coach: "Kru Somchai", day: "Mon", startTime: "07:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Ring A", booked: 16 },
  { key: "pad-work-mon", title: "Pad Work", discipline: "Muay Thai", coach: "Kru Anan", day: "Mon", startTime: "18:00", durationMin: 90, level: "Intermediate", capacity: 18, ring: "Ring B", booked: 18 },
  { key: "clinch-knees-tue", title: "Clinch & Knees", discipline: "Muay Thai", coach: "Kru Somchai", day: "Tue", startTime: "19:00", durationMin: 60, level: "Advanced", capacity: 14, ring: "Ring A", booked: 11 },
  { key: "fundamentals-wed", title: "Fundamentals", discipline: "Kickboxing", coach: "Coach Mia", day: "Wed", startTime: "07:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Ring A", booked: 13 },
  { key: "sparring-night-thu", title: "Sparring Night", discipline: "Muay Thai", coach: "Kru Anan", day: "Thu", startTime: "19:00", durationMin: 90, level: "Sparring", capacity: 12, ring: "Ring B", booked: 12 },
  { key: "conditioning-fri", title: "Conditioning", discipline: "Boxing", coach: "Coach Mia", day: "Fri", startTime: "18:00", durationMin: 45, level: "Intermediate", capacity: 24, ring: "Mat Area", booked: 19 },
  { key: "open-mat-sat", title: "Open Mat", discipline: "Brazilian Jiu-Jitsu", coach: "Kru Somchai", day: "Sat", startTime: "10:00", durationMin: 120, level: "Intermediate", capacity: 30, ring: "Ring A", booked: 22 },
  { key: "evening-technique-wed", title: "Evening Technique", discipline: "Taekwondo", coach: "Coach Mia", day: "Wed", startTime: "18:00", durationMin: 60, level: "Intermediate", capacity: 18, ring: "Ring B", booked: 15 },
  { key: "sunday-drills-sun", title: "Sunday Drills", discipline: "Kung Fu", coach: "Kru Anan", day: "Sun", startTime: "09:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Mat Area", booked: 9 },
];

/**
 * `classKey` back-fills the legacy title+day match into a real FK once the
 * class documents are inserted (see seed.ts) — the original fixture only
 * distinguishes same-titled classes ("Fundamentals" Mon vs Wed) by day.
 * `discipline` is denormalized from the matching seedClasses entry.
 */
export const seedSessions = [
  { classKey: "pad-work-mon", date: "2026-07-28", title: "Pad Work", discipline: "Muay Thai", coach: "Kru Anan", attended: 17, capacity: 18, rounds: 12, status: "Completed" as const },
  { classKey: "fundamentals-mon", date: "2026-07-28", title: "Fundamentals", discipline: "Muay Thai", coach: "Kru Somchai", attended: 14, capacity: 20, rounds: 8, status: "Completed" as const },
  { classKey: "clinch-knees-tue", date: "2026-07-27", title: "Clinch & Knees", discipline: "Muay Thai", coach: "Kru Somchai", attended: 10, capacity: 14, rounds: 10, status: "Completed" as const },
  { classKey: "sparring-night-thu", date: "2026-07-26", title: "Sparring Night", discipline: "Muay Thai", coach: "Kru Anan", attended: 0, capacity: 12, rounds: 0, status: "Cancelled" as const },
  { classKey: "conditioning-fri", date: "2026-07-29", title: "Conditioning", discipline: "Boxing", coach: "Coach Mia", attended: 0, capacity: 24, rounds: 0, status: "Scheduled" as const },
];
