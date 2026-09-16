/**
 * Scoring constants and config — schema.md §6.
 * Kept separate so they can be imported + tested without the DB.
 */

import type { Severity } from "@gigw/db";

/** Default severity weights per schema.md §6. Tunable after Phase 3. */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface ScoringConfig {
  weights: Record<Severity, number>;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: SEVERITY_WEIGHTS,
};

/**
 * Compute a 0-100 page score from a flat list of severity values and their
 * pass/fail status.
 *
 * Only "pass" results contribute to the numerator.
 * "needs_review" and "not_applicable" results are excluded from both
 * numerator and denominator (they don't affect the automated score).
 */
export function computePageScore(
  results: Array<{ status: "pass" | "fail" | "needs_review" | "not_applicable"; severity: Severity }>,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): number {
  let passed = 0;
  let total = 0;

  for (const result of results) {
    if (result.status === "needs_review" || result.status === "not_applicable") {
      continue;
    }
    const weight = config.weights[result.severity];
    total += weight;
    if (result.status === "pass") {
      passed += weight;
    }
  }

  if (total === 0) return 100; // no applicable checks = no violations
  return Math.round((passed / total) * 100);
}
