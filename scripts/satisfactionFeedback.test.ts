import { describe, expect, test } from "bun:test";
import { feedbackComments, isSatisfiedFeedback, needsFeedbackAttention } from "../src/lib/satisfactionFeedback";

describe("yes/no feedback", () => {
  test("No needs attention until resolved", () => {
    expect(needsFeedbackAttention({ satisfied: false, rating: null, status: "new" })).toBe(true);
    expect(needsFeedbackAttention({ satisfied: false, rating: null, status: "resolved" })).toBe(false);
  });
  test("Yes is satisfied without a manufactured rating", () => {
    expect(isSatisfiedFeedback({ satisfied: true, rating: null, status: "new" })).toBe(true);
    expect(needsFeedbackAttention({ satisfied: true, rating: null, status: "new" })).toBe(false);
  });
  test("legacy ratings remain identifiable", () => {
    expect(isSatisfiedFeedback({ satisfied: null, rating: 4, status: "new" })).toBe(true);
    expect(isSatisfiedFeedback({ satisfied: null, rating: 3, status: "new" })).toBe(false);
  });
  test("optional comments retain invoice reference and length limit", () => {
    expect(feedbackComments("", "INV-123")).toBe("Ref: INV-123");
    expect(feedbackComments(" ")).toBeNull();
    expect(feedbackComments("x".repeat(2100))).toHaveLength(2000);
  });
});