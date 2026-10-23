import { describe, expect, test } from "bun:test";
import { happinessFor, indexHappiness, latestHappiness } from "../src/lib/customerHappiness";

describe("customer happiness", () => {
  test("Yes is happy (green)", () => expect(latestHappiness([{ at: "2026-10-01", satisfied: true }])).toBe("happy"));
  test("No is unhappy (red)", () => expect(latestHappiness([{ at: "2026-10-01", satisfied: false }])).toBe("unhappy"));
  test("4 stars is happy, 3 stars unhappy", () => {
    expect(latestHappiness([{ at: "2026-10-01", rating: 4 }])).toBe("happy");
    expect(latestHappiness([{ at: "2026-10-01", rating: 3 }])).toBe("unhappy");
  });
  test("newest answer wins", () =>
    expect(latestHappiness([{ at: "2026-10-01", rating: 1 }, { at: "2026-10-20", satisfied: true }])).toBe("happy"));
  test("no answer stays default", () => {
    expect(latestHappiness([])).toBeNull();
    expect(happinessFor(indexHappiness([]), "x", "2395550000")).toBeNull();
  });
  test("matches by phone when no customer id", () =>
    expect(happinessFor(indexHappiness([{ customer_id: null, phone: "+1 (239) 555-0000", happy: false }]), "x", "2395550000")).toBe("unhappy"));
});
