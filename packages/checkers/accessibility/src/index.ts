/**
 * @gigw/checker-accessibility
 *
 * All Section 5.2 (WCAG 2.1 AA) checkers.
 * Owner: Member A. See requirements.md §5 for the full clause table.
 *
 * Checker files (one-file-per-clause-group per rules.md §5):
 *
 *   axe-core.ts           — 15 automatable clauses via axe-core          [A-008/A-009] DONE
 *   text-alternatives.ts  — 5.2.1  (alt text meaningfulness, semi)       [A-010] TODO
 *   captions.ts           — 5.2.3  (caption track presence, semi)        [A-010] TODO
 *   keyboard.ts           — 5.2.21, 5.2.22 (tab-order traversal, semi)   [A-010] TODO
 *   colour.ts             — 5.2.12 (colour-only cues, semi)              [A-010] TODO
 *   reflow.ts             — 5.2.15, 5.2.17 (resize/reflow, semi/auto)    [A-010] TODO
 *   images-of-text.ts     — 5.2.16 (image OCR heuristic, semi)           [A-010] TODO
 *   text-spacing.ts       — 5.2.19 (spacing override injection, semi)    [A-010] TODO
 *   motion.ts             — 5.2.25 (marquee/auto-carousel detection)     [A-010] TODO
 *   flashing.ts           — 5.2.26 (frame-rate analysis, semi)           [A-010] TODO
 *   focus-order.ts        — 5.2.29 (tab vs DOM order, semi)              [A-010] TODO
 *   link-purpose.ts       — 5.2.30 (generic link text, semi)             [A-010] TODO
 *   headings.ts           — 5.2.32 (heading hierarchy, semi)             [A-010] TODO
 *   language-parts.ts     — 5.2.39 (lang span detection, semi)           [A-010] TODO
 *   navigation.ts         — 5.2.42, 5.2.43 (cross-page structural diff)  [A-010] TODO
 *   error-id.ts           — 5.2.44 (error element presence, semi)        [A-010] TODO
 *   status-messages.ts    — 5.2.50 (ARIA live regions, semi)             [A-010] TODO
 */

import { axeCoreChecker } from "./axe-core.js";
import type { CheckerModule, CheckerFn, CheckerContext } from "./types.js";

export type { CheckerModule, CheckerFn, CheckerContext };

/** Registry of all accessibility checkers — add new ones here as they are built */
export const accessibilityCheckers: CheckerModule[] = [
  axeCoreChecker,
  // Additional checkers added here as A-010 tasks complete
];
