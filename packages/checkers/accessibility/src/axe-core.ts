/**
 * axe-core.ts — Section 5.2 accessibility checker (automatable clauses)
 *
 * Runs axe-core via @axe-core/playwright against a Playwright page and
 * maps the results to CheckerResult[] per schema.md §2.
 *
 * Clauses covered (all automatable via axe-core):
 *   5.2.7  (WCAG 1.3.1) — info/relationships
 *   5.2.11 (WCAG 1.3.5) — input purpose / autocomplete
 *   5.2.13 (WCAG 1.4.2) — audio control / autoplay
 *   5.2.14 (WCAG 1.4.3) — contrast minimum 4.5:1
 *   5.2.17 (WCAG 1.4.10) — reflow at 320px
 *   5.2.18 (WCAG 1.4.11) — non-text contrast 3:1
 *   5.2.27 (WCAG 2.4.1)  — bypass blocks / skip links
 *   5.2.28 (WCAG 2.4.2)  — page titled
 *   5.2.31 (WCAG 2.4.5)  — multiple ways to locate
 *   5.2.33 (WCAG 2.4.7)  — focus visible
 *   5.2.36 (WCAG 2.5.3)  — label in name
 *   5.2.38 (WCAG 3.1.1)  — page language
 *   5.2.45 (WCAG 3.3.2)  — labels/instructions
 *   5.2.48 (WCAG 4.1.1)  — valid markup
 *   5.2.49 (WCAG 4.1.2)  — name, role, value
 *
 * Owner: Member A  (task A-008 / A-009)
 */

import AxeBuilder from "@axe-core/playwright";
import type { Result, NodeResult } from "axe-core";
import type { CheckerModule, CheckerContext } from "./types.js";
import type { CheckerResult, Severity } from "@gigw/db";

// ── axe rule → clause mapping ─────────────────────────────────────────────────
//
// Maps each relevant axe rule ID to the GIGW clause(s) it covers and the
// severity from the requirements.md §5 table (team-assigned heuristic).
//
// axe rule IDs: https://dequeuniversity.com/rules/axe/4.9

const AXE_RULE_MAP: Record<string, { clauseIds: string[]; severity: Severity }> = {
  // 5.2.7 — info and relationships
  "aria-required-children": { clauseIds: ["5.2.7"], severity: "high" },
  "aria-required-parent": { clauseIds: ["5.2.7"], severity: "high" },
  "definition-list": { clauseIds: ["5.2.7"], severity: "high" },
  dlitem: { clauseIds: ["5.2.7"], severity: "high" },
  list: { clauseIds: ["5.2.7"], severity: "high" },
  listitem: { clauseIds: ["5.2.7"], severity: "high" },
  "td-headers-attr": { clauseIds: ["5.2.7"], severity: "high" },
  "th-has-data-cells": { clauseIds: ["5.2.7"], severity: "high" },
  "aria-allowed-attr": { clauseIds: ["5.2.7"], severity: "high" },
  "aria-valid-attr": { clauseIds: ["5.2.7"], severity: "high" },
  "aria-valid-attr-value": { clauseIds: ["5.2.7"], severity: "high" },

  // 5.2.11 — input purpose
  "autocomplete-valid": { clauseIds: ["5.2.11"], severity: "medium" },

  // 5.2.13 — audio control
  "audio-caption": { clauseIds: ["5.2.13"], severity: "medium" },

  // 5.2.14 — contrast minimum
  "color-contrast": { clauseIds: ["5.2.14"], severity: "high" },

  // 5.2.17 — reflow (axe checks overflow)
  "css-orientation-lock": { clauseIds: ["5.2.17"], severity: "medium" },

  // 5.2.18 — non-text contrast
  "color-contrast-enhanced": { clauseIds: ["5.2.18"], severity: "medium" },

  // 5.2.27 — bypass blocks / skip links
  bypass: { clauseIds: ["5.2.27"], severity: "medium" },
  region: { clauseIds: ["5.2.27"], severity: "medium" },

  // 5.2.28 — page titled
  "document-title": { clauseIds: ["5.2.28"], severity: "medium" },

  // 5.2.31 — multiple ways to locate
  "landmark-one-main": { clauseIds: ["5.2.31"], severity: "medium" },

  // 5.2.33 — focus visible
  "focus-trap": { clauseIds: ["5.2.33"], severity: "high" },

  // 5.2.36 — label in name
  "label-content-name-mismatch": { clauseIds: ["5.2.36"], severity: "medium" },

  // 5.2.38 — page language
  "html-has-lang": { clauseIds: ["5.2.38"], severity: "high" },
  "html-lang-valid": { clauseIds: ["5.2.38"], severity: "high" },
  "valid-lang": { clauseIds: ["5.2.38"], severity: "high" },

  // 5.2.45 — labels/instructions
  label: { clauseIds: ["5.2.45"], severity: "high" },
  "label-title-only": { clauseIds: ["5.2.45"], severity: "high" },
  "aria-label": { clauseIds: ["5.2.45"], severity: "high" },

  // 5.2.48 — valid markup
  "duplicate-id": { clauseIds: ["5.2.48"], severity: "medium" },
  "duplicate-id-active": { clauseIds: ["5.2.48"], severity: "medium" },
  "duplicate-id-aria": { clauseIds: ["5.2.48"], severity: "medium" },

  // 5.2.49 — name, role, value
  "button-name": { clauseIds: ["5.2.49"], severity: "high" },
  "image-alt": { clauseIds: ["5.2.49"], severity: "high" },
  "input-button-name": { clauseIds: ["5.2.49"], severity: "high" },
  "input-image-alt": { clauseIds: ["5.2.49"], severity: "high" },
  "link-name": { clauseIds: ["5.2.49"], severity: "high" },
  "role-img-alt": { clauseIds: ["5.2.49"], severity: "high" },
  "select-name": { clauseIds: ["5.2.49"], severity: "high" },
  "svg-img-alt": { clauseIds: ["5.2.49"], severity: "high" },
  "aria-hidden-body": { clauseIds: ["5.2.49"], severity: "high" },
  "aria-hidden-focus": { clauseIds: ["5.2.49"], severity: "high" },
};

// All clause IDs covered by this checker (for the index registry)
export const AXE_CORE_CLAUSE_IDS = [
  "5.2.7",
  "5.2.11",
  "5.2.13",
  "5.2.14",
  "5.2.17",
  "5.2.18",
  "5.2.27",
  "5.2.28",
  "5.2.31",
  "5.2.33",
  "5.2.36",
  "5.2.38",
  "5.2.45",
  "5.2.48",
  "5.2.49",
];

// ── Checker implementation ────────────────────────────────────────────────────

export const axeCoreChecker: CheckerModule = {
  checkerId: "a11y-axe-core",
  clauseIds: AXE_CORE_CLAUSE_IDS,

  async run(ctx: CheckerContext): Promise<CheckerResult[]> {
    const results: CheckerResult[] = [];
    const now = new Date();

    let axeResults;
    try {
      axeResults = await new AxeBuilder({ page: ctx.page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
        .analyze();
    } catch (err) {
      // If axe itself crashes, return needs_review for all covered clauses
      for (const clauseId of AXE_CORE_CLAUSE_IDS) {
        const mapping = getMappingForClause(clauseId);
        results.push(
          makeResult(
            clauseId,
            ctx.pageUrl,
            "needs_review",
            mapping?.severity ?? "medium",
            `axe-core failed to run: ${String(err)}`,
            now,
          ),
        );
      }
      return results;
    }

    // Build a set of which rules had violations and which passed/were inapplicable
    const violated = new Set(axeResults.violations.map((v: Result) => v.id));
    const incomplete = new Set(axeResults.incomplete.map((v: Result) => v.id));
    const inapplicable = new Set(axeResults.inapplicable.map((v: Result) => v.id));

    // One result per (clauseId, ruleId) pair — then collapse to one per clause
    const clauseStatus = new Map<
      string,
      { status: "pass" | "fail" | "needs_review"; evidence: string; severity: Severity }
    >();

    // Process violations
    for (const violation of axeResults.violations) {
      const mapping: { clauseIds: string[]; severity: Severity } | undefined =
        AXE_RULE_MAP[violation.id];
      if (!mapping) continue;

      for (const clauseId of mapping.clauseIds) {
        const firstNode: NodeResult | undefined = violation.nodes[0];
        const evidence =
          `[${violation.id}] ${violation.description}. ` +
          (firstNode ? `First failing element: ${firstNode.target.join(", ")}` : "");

        const existing = clauseStatus.get(clauseId);
        // A fail always wins
        if (!existing || existing.status !== "fail") {
          clauseStatus.set(clauseId, {
            status: "fail",
            evidence,
            severity: mapping.severity,
          });
        }
      }
    }

    // Process incomplete (needs_review) — only if not already failed
    for (const item of axeResults.incomplete) {
      const mapping: { clauseIds: string[]; severity: Severity } | undefined =
        AXE_RULE_MAP[item.id];
      if (!mapping) continue;

      for (const clauseId of mapping.clauseIds) {
        if (clauseStatus.get(clauseId)?.status === "fail") continue;
        const firstNode: NodeResult | undefined = item.nodes[0];
        clauseStatus.set(clauseId, {
          status: "needs_review",
          evidence:
            `[${item.id}] ${item.description} — requires manual verification. ` +
            (firstNode ? `Element: ${firstNode.target.join(", ")}` : ""),
          severity: mapping.severity,
        });
      }
    }

    // Build results for all covered clauses
    for (const clauseId of AXE_CORE_CLAUSE_IDS) {
      const outcome = clauseStatus.get(clauseId);

      if (outcome) {
        results.push(
          makeResult(
            clauseId,
            ctx.pageUrl,
            outcome.status,
            outcome.severity,
            outcome.evidence,
            now,
          ),
        );
      } else {
        // Clause had no violations and no incomplete — determine pass vs not_applicable
        const rulesForClause = (
          Object.entries(AXE_RULE_MAP) as Array<
            [string, { clauseIds: string[]; severity: Severity }]
          >
        )
          .filter(([, m]) => m.clauseIds.includes(clauseId))
          .map(([ruleId]) => ruleId);

        const allInapplicable = rulesForClause.every(
          (r) => inapplicable.has(r) && !violated.has(r) && !incomplete.has(r),
        );

        const mapping = getMappingForClause(clauseId);
        results.push(
          makeResult(
            clauseId,
            ctx.pageUrl,
            allInapplicable ? "not_applicable" : "pass",
            mapping?.severity ?? "medium",
            allInapplicable
              ? "No applicable elements found on this page"
              : "All axe-core rules for this clause passed",
            now,
          ),
        );
      }
    }

    return results;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMappingForClause(clauseId: string): { severity: Severity } | undefined {
  return Object.values(AXE_RULE_MAP).find((m) => m.clauseIds.includes(clauseId));
}

function makeResult(
  clauseId: string,
  pageUrl: string,
  status: "pass" | "fail" | "needs_review" | "not_applicable",
  severity: Severity,
  evidence: string,
  checkedAt: Date,
): CheckerResult {
  return {
    // id will be assigned by DB on insert — use empty string as placeholder
    id: "",
    clauseId,
    pageUrl,
    status,
    severity,
    evidence,
    detail: null,
    checkedAt,
    pageReportId: null,
  };
}
