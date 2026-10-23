import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tsxLoader = createRequire(import.meta.url).resolve("tsx");
const timeModule = fileURLToPath(new URL("./time.ts", import.meta.url));

/**
 * GYM_TIMEZONE changes the timezone of the whole process, so each case runs in
 * a child started in UTC, the way a Vercel function starts, instead of here.
 */
function inUtcProcess(env: Record<string, string>, script: string) {
  return execFileSync(
    process.execPath,
    ["--import", tsxLoader, "--input-type=module", "-e", `import * as time from ${JSON.stringify(timeModule)};\n${script}`],
    { env: { ...process.env, ...env, TZ: "UTC" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

describe("GYM_TIMEZONE", () => {
  it("pins the process to the gym's zone even when it starts in UTC", () => {
    const out = inUtcProcess(
      { GYM_TIMEZONE: "Asia/Colombo" },
      `console.log(JSON.stringify({
        zone: time.GYM_TIMEZONE,
        punch: new Date("2026-10-23T07:45:00").toISOString(),
        dayStart: time.startOfDay(new Date("2026-10-22T20:00:00Z")).toISOString(),
      }))`,
    );

    expect(JSON.parse(out)).toEqual({
      zone: "Asia/Colombo",
      // An offset-less device timestamp is read as Colombo wall-clock time.
      punch: "2026-10-23T02:15:00.000Z",
      // 20:00 UTC is already 01:30 on the 23rd in Colombo, so its day began at 18:30 UTC.
      dayStart: "2026-10-22T18:30:00.000Z",
    });
  });

  it("leaves the process timezone alone when unset", () => {
    expect(inUtcProcess({ GYM_TIMEZONE: "" }, "console.log(time.GYM_TIMEZONE)")).toBe("UTC");
  });

  it("refuses to start with a zone that doesn't exist", () => {
    expect(() => inUtcProcess({ GYM_TIMEZONE: "Mars/Base" }, "")).toThrow(/not a valid IANA timezone/);
  });
});
