import { describe, it, expect } from "vitest";
import { computePageScore } from "./scoring.js";

describe("computePageScore", () => {
  it("returns 100 when there are no applicable results", () => {
    expect(computePageScore([])).toBe(100);
    expect(computePageScore([{ status: "not_applicable", severity: "high" }])).toBe(100);
    expect(computePageScore([{ status: "needs_review", severity: "medium" }])).toBe(100);
  });

  it("returns 100 when all applicable results pass", () => {
    const results = [
      { status: "pass" as const, severity: "high" as const },
      { status: "pass" as const, severity: "low" as const },
    ];
    expect(computePageScore(results)).toBe(100);
  });

  it("returns 0 when all applicable results fail", () => {
    const results = [
      { status: "fail" as const, severity: "high" as const },
      { status: "fail" as const, severity: "medium" as const },
    ];
    expect(computePageScore(results)).toBe(0);
  });

  it("weights high failures more than low failures", () => {
    // 1 high pass (weight 3), 1 low fail (weight 1) → 3/4 = 75
    const results = [
      { status: "pass" as const, severity: "high" as const },
      { status: "fail" as const, severity: "low" as const },
    ];
    expect(computePageScore(results)).toBe(75);
  });

  it("excludes needs_review and not_applicable from scoring", () => {
    const results = [
      { status: "pass" as const, severity: "high" as const }, // weight 3, counts
      { status: "needs_review" as const, severity: "high" as const }, // excluded
      { status: "not_applicable" as const, severity: "medium" as const }, // excluded
    ];
    // 3/3 = 100
    expect(computePageScore(results)).toBe(100);
  });
});
