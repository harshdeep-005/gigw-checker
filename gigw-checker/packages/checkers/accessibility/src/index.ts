/**
 * @gigw/checker-accessibility
 *
 * All Section 5.2 (WCAG 2.1 AA) checkers.
 * Owner: Member A. See requirements.md §5 for the full clause table.
 *
 * Checker files are organised one-file-per-clause-group (rules.md §5):
 *
 *   axe-core.ts        — clauses covered by axe-core out of the box
 *                        (5.2.7, 5.2.11, 5.2.13, 5.2.14, 5.2.17, 5.2.18,
 *                         5.2.27, 5.2.28, 5.2.31, 5.2.33, 5.2.36, 5.2.38,
 *                         5.2.45, 5.2.48, 5.2.49)
 *   text-alternatives.ts  — 5.2.1 (alt text meaningfulness, semi)
 *   captions.ts           — 5.2.3 (caption track presence, semi)
 *   keyboard.ts           — 5.2.21, 5.2.22 (tab-order traversal, semi)
 *   colour.ts             — 5.2.12 (colour-only cues, semi)
 *   reflow.ts             — 5.2.15, 5.2.17 (resize/reflow, semi/auto)
 *   images-of-text.ts     — 5.2.16 (image OCR heuristic, semi)
 *   text-spacing.ts       — 5.2.19 (spacing override injection, semi)
 *   motion.ts             — 5.2.25 (marquee/auto-carousel detection, semi)
 *   flashing.ts           — 5.2.26 (frame-rate analysis, semi)
 *   focus-order.ts        — 5.2.29 (tab vs DOM order, semi)
 *   link-purpose.ts       — 5.2.30 (generic link text, semi)
 *   headings.ts           — 5.2.32 (heading hierarchy, semi)
 *   language-parts.ts     — 5.2.39 (lang span detection, semi)
 *   navigation.ts         — 5.2.42, 5.2.43 (cross-page structural diff, semi)
 *   error-id.ts           — 5.2.44 (error element presence, semi)
 *   status-messages.ts    — 5.2.50 (ARIA live regions, semi)
 *
 * TODO (A-009, A-010): implement each file above. This index just re-exports
 * the registry once files exist.
 */

export type { CheckerModule, CheckerContext, CheckerFn } from "./types.js";

// Registry of all accessibility checkers — populated as each file is implemented
export const accessibilityCheckers: import("./types.js").CheckerModule[] = [
  // checkers will be imported and listed here as they are built (A-009, A-010)
];
