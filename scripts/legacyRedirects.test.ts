import { describe, expect, test } from "bun:test";
import { redirectForOldPath } from "../src/data/livePaths";

describe("old Google addresses go to the closest live page", () => {
  test("removed city area pages go to Fort Myers", () => {
    expect(redirectForOldPath("/areas/cape-coral")).toBe("/areas/fort-myers");
  });
  test("removed city service pages go to the Fort Myers version", () => {
    expect(redirectForOldPath("/mobile-brake-repair-cape-coral")).toBe("/brake-repair-fort-myers-fl");
    expect(redirectForOldPath("/mobile-ac-repair-estero")).toBe("/ac-repair-fort-myers-fl");
  });
  test("discontinued tire service goes to the services list", () => {
    expect(redirectForOldPath("/mobile-tire-service-lehigh-acres")).toBe("/services");
  });
  test("old -fl addresses drop the suffix", () => {
    expect(redirectForOldPath("/mobile-mechanic-lehigh-acres-fl")).toBe("/mobile-mechanic-lehigh-acres");
  });
  test("live pages are never redirected", () => {
    expect(redirectForOldPath("/areas/lehigh-acres")).toBeNull();
    expect(redirectForOldPath("/brake-repair-lehigh-acres")).toBeNull();
  });
});
