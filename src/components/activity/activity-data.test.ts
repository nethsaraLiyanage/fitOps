import { describe, expect, it } from "vitest";
import { activityStyle, relativeTime } from "./activity-data";

describe("relativeTime", () => {
  const now = new Date("2026-09-03T12:00:00.000Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it("describes the last minute as 'just now'", () => {
    expect(relativeTime(ago(5 * SECOND), now)).toBe("just now");
    expect(relativeTime(ago(59 * SECOND), now)).toBe("just now");
  });

  it("counts minutes, then hours, then days", () => {
    expect(relativeTime(ago(5 * MINUTE), now)).toBe("5 min ago");
    expect(relativeTime(ago(HOUR), now)).toBe("1 hour ago");
    expect(relativeTime(ago(3 * HOUR), now)).toBe("3 hours ago");
    expect(relativeTime(ago(DAY), now)).toBe("1 day ago");
    expect(relativeTime(ago(4 * DAY), now)).toBe("4 days ago");
  });

  it("never reports a negative age for a clock-skewed timestamp", () => {
    expect(relativeTime(new Date(now + 10 * MINUTE).toISOString(), now)).toBe("just now");
  });
});

describe("activityStyle", () => {
  it("gives each known type its own icon and colour", () => {
    expect(activityStyle("member.joined").color).toBe("text-success");
    expect(activityStyle("inventory.low_stock").color).toBe("text-destructive");
    expect(activityStyle("member.joined").icon).not.toBe(activityStyle("inventory.low_stock").icon);
  });

  it("falls back rather than blanking the feed for an unknown type", () => {
    const style = activityStyle("something.new");

    expect(style.icon).toBeTruthy();
    expect(style.color).toBe("text-muted-foreground");
  });
});
