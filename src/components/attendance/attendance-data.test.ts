import { describe, expect, it } from "vitest";
import {
  AttendanceRecord,
  buildHeatmapRows,
  busiestCount,
  formatDuration,
  formatHour,
  heatColor,
} from "./attendance-data";

const record = (checkIn: string, checkOut: string | null): AttendanceRecord => ({
  id: "1",
  memberId: "m1",
  memberName: "Sarah Connor",
  membershipId: "GYM-0001",
  checkIn,
  checkOut,
});

describe("formatDuration", () => {
  it("reports an open session as 'In gym'", () => {
    expect(formatDuration(record("2026-09-03T06:30:00.000Z", null))).toBe("In gym");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(record("2026-09-03T06:30:00.000Z", "2026-09-03T08:15:00.000Z"))).toBe("1h 45m");
  });

  it("drops the hour part for a short session", () => {
    expect(formatDuration(record("2026-09-03T06:30:00.000Z", "2026-09-03T06:55:00.000Z"))).toBe("25m");
  });

  it("never reports a negative duration", () => {
    expect(formatDuration(record("2026-09-03T08:00:00.000Z", "2026-09-03T07:00:00.000Z"))).toBe("0m");
  });
});

describe("formatHour", () => {
  it("labels hours in 12-hour form", () => {
    expect(formatHour(0)).toBe("12AM");
    expect(formatHour(6)).toBe("6AM");
    expect(formatHour(12)).toBe("12PM");
    expect(formatHour(18)).toBe("6PM");
  });
});

describe("buildHeatmapRows", () => {
  it("pivots sparse cells into Monday-first rows sorted by hour", () => {
    const rows = buildHeatmapRows([
      { weekday: 2, hour: 18, count: 4 },
      { weekday: 0, hour: 6, count: 2 },
      { weekday: 6, hour: 18, count: 1 },
    ]);

    expect(rows.map((r) => r.label)).toEqual(["6AM", "6PM"]);
    expect(rows[0].counts).toEqual([2, 0, 0, 0, 0, 0, 0]);
    expect(rows[1].counts).toEqual([0, 0, 4, 0, 0, 0, 1]);
  });

  it("returns no rows when there are no check-ins", () => {
    expect(buildHeatmapRows([])).toEqual([]);
  });

  it("ignores cells with an out-of-range weekday", () => {
    expect(buildHeatmapRows([{ weekday: 7, hour: 9, count: 3 }])).toEqual([]);
  });
});

describe("heatColor", () => {
  it("scales shading against the busiest bucket", () => {
    const rows = buildHeatmapRows([
      { weekday: 0, hour: 6, count: 2 },
      { weekday: 1, hour: 18, count: 20 },
    ]);
    const busiest = busiestCount(rows);

    expect(busiest).toBe(20);
    expect(heatColor(0, busiest)).toBe("bg-secondary");
    expect(heatColor(2, busiest)).toBe("bg-primary/20");
    expect(heatColor(20, busiest)).toBe("bg-primary");
  });

  it("stays neutral when nothing has been recorded", () => {
    expect(heatColor(0, 0)).toBe("bg-secondary");
    expect(busiestCount([])).toBe(0);
  });
});
