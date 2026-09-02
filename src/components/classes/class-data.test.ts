import { describe, it, expect } from "vitest";
import { TrainingClass, ClassSession, sessionsToday } from "./class-data";

// 2026-07-29 is a Wednesday.
const WEDNESDAY = new Date(2026, 6, 29);

const classes: TrainingClass[] = [
  { id: "1", title: "Evening Technique", discipline: "Taekwondo", coach: "Coach Mia", day: "Wed", startTime: "18:00", durationMin: 60, level: "Intermediate", capacity: 18, ring: "Ring B", booked: 15 },
  { id: "2", title: "Fundamentals", discipline: "Muay Thai", coach: "Coach Mia", day: "Wed", startTime: "07:00", durationMin: 60, level: "Beginner", capacity: 20, ring: "Ring A", booked: 13 },
  { id: "3", title: "Open Mat", discipline: "Brazilian Jiu-Jitsu", coach: "Kru Somchai", day: "Sat", startTime: "10:00", durationMin: 120, level: "Intermediate", capacity: 30, ring: "Ring A", booked: 22 },
];

describe("sessionsToday", () => {
  it("returns only today's classes, earliest first", () => {
    const today = sessionsToday(classes, [], WEDNESDAY);

    expect(today.map((s) => s.title)).toEqual(["Fundamentals", "Evening Technique"]);
  });

  it("carries each class's discipline through to today's schedule", () => {
    const today = sessionsToday(classes, [], WEDNESDAY);

    expect(today.map((s) => s.discipline)).toEqual(["Muay Thai", "Taekwondo"]);
  });

  it("takes status and attendance from a matching session logged today (joined by classId)", () => {
    const log: ClassSession[] = [
      { id: "9", classId: "2", date: "2026-07-29", title: "Fundamentals", discipline: "Muay Thai", coach: "Coach Mia", attended: 11, capacity: 20, rounds: 8, status: "Completed" },
    ];
    const today = sessionsToday(classes, log, WEDNESDAY);

    expect(today[0]).toMatchObject({ title: "Fundamentals", status: "Completed", booked: 11 });
    expect(today[1].status).toBe("Scheduled");
  });

  it("includes a session logged today that no recurring class covers, with its own discipline", () => {
    const log: ClassSession[] = [
      { id: "10", classId: null, date: "2026-07-29", title: "Extra Sparring", discipline: "Kickboxing", coach: "Kru Anan", attended: 0, capacity: 12, rounds: 0, status: "Scheduled" },
    ];
    const today = sessionsToday(classes, log, WEDNESDAY);

    expect(today.map((s) => s.title)).toContain("Extra Sparring");
    expect(today.find((s) => s.title === "Extra Sparring")?.discipline).toBe("Kickboxing");
  });

  it("ignores sessions logged on other days", () => {
    const log: ClassSession[] = [
      { id: "11", classId: null, date: "2026-07-28", title: "Pad Work", discipline: "Muay Thai", coach: "Kru Anan", attended: 17, capacity: 18, rounds: 12, status: "Completed" },
    ];
    const today = sessionsToday(classes, log, WEDNESDAY);

    expect(today.map((s) => s.title)).not.toContain("Pad Work");
  });

  it("returns nothing on a day with no classes", () => {
    const sunday = new Date(2026, 6, 26);
    expect(sessionsToday(classes, [], sunday)).toEqual([]);
  });
});
