import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS, categoryShare, colorForSlice, exportFilename } from "./reports-data";

describe("categoryShare", () => {
  const slices = [
    { name: "Cardio", value: 4 },
    { name: "Strength", value: 4 },
    { name: "Recovery", value: 2 },
  ];

  it("reports each slice's whole-percent share", () => {
    expect(categoryShare(4, slices)).toBe(40);
    expect(categoryShare(2, slices)).toBe(20);
  });

  it("does not divide by zero when nothing is recorded", () => {
    expect(categoryShare(0, [])).toBe(0);
  });
});

describe("colorForSlice", () => {
  it("cycles the palette so extra categories still get a colour", () => {
    expect(colorForSlice(0)).toBe(CATEGORY_COLORS[0]);
    expect(colorForSlice(CATEGORY_COLORS.length)).toBe(CATEGORY_COLORS[0]);
    expect(colorForSlice(CATEGORY_COLORS.length + 2)).toBe(CATEGORY_COLORS[2]);
  });
});

describe("exportFilename", () => {
  it("date-stamps the download", () => {
    expect(exportFilename("members")).toMatch(/^fitops-members-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(exportFilename("attendance")).toMatch(/^fitops-attendance-/);
  });
});
