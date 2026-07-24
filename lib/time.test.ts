import { describe, expect, it } from "vitest";
import { istDate, istHourMinute, startOfIstWeek } from "@/lib/time";

describe("IST scheduling", () => {
  it("uses India date when UTC is still on the prior day", () => {
    const instant = new Date("2026-07-23T20:00:00.000Z");
    expect(istDate(instant)).toBe("2026-07-24");
    expect(istHourMinute(instant)).toEqual({ hour: 1, minute: 30 });
  });

  it("finds Monday in IST", () => {
    expect(startOfIstWeek(new Date("2026-07-24T10:00:00.000Z"))).toBe("2026-07-20");
  });
});

