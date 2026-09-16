/**
 * Shared types for quality + lifecycle checkers.
 * Mirrors schema.md §3.
 */

import type { Page } from "playwright";
import type { CheckerResult } from "@gigw/db";

export interface CheckerContext {
  page: Page;
  pageUrl: string;
  html: string;
}

export type CheckerFn = (ctx: CheckerContext) => Promise<CheckerResult[]>;

export interface CheckerModule {
  checkerId: string;
  clauseIds: string[];
  run: CheckerFn;
}
