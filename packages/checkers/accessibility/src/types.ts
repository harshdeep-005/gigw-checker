/**
 * Shared types for accessibility checkers.
 * CheckerModule / CheckerFn / CheckerContext mirror schema.md §3 exactly.
 * Import from here inside this package; other packages import from @gigw/db for
 * the DB-side types (CheckerResult, Severity, CheckStatus).
 */

import type { Page } from "playwright";
import type { CheckerResult } from "@gigw/db";

export interface CheckerContext {
  page: Page;       // Playwright Page, already navigated to pageUrl
  pageUrl: string;
  html: string;     // rendered HTML snapshot (page.content())
}

export type CheckerFn = (ctx: CheckerContext) => Promise<CheckerResult[]>;

export interface CheckerModule {
  checkerId: string;    // unique, e.g. "a11y-contrast" — matches ClauseDefinition.checkerId
  clauseIds: string[];  // which clause(s) this checker covers, e.g. ["5.2.14"]
  run: CheckerFn;
}
