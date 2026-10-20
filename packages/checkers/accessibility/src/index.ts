/**
 * @gigw/checker-accessibility
 *
 * All Section 5.2 (WCAG 2.1 AA) checkers.
 * Owner: Member A. See requirements.md §5 for the full clause table.
 */

import { axeCoreChecker } from "./axe-core.js";
import { textAlternativesChecker } from "./text-alternatives.js";
import { captionsChecker } from "./captions.js";
import { keyboardChecker } from "./keyboard.js";
import { reflowChecker } from "./reflow.js";
import { linkPurposeChecker } from "./link-purpose.js";
import { headingsChecker } from "./headings.js";
import { colourChecker } from "./colour.js";
import { imagesOfTextChecker } from "./images-of-text.js";
import { textSpacingChecker } from "./text-spacing.js";
import { motionChecker } from "./motion.js";
import { flashingChecker } from "./flashing.js";
import { focusOrderChecker } from "./focus-order.js";
import { languagePartsChecker } from "./language-parts.js";
import { navigationChecker } from "./navigation.js";
import { errorIdChecker } from "./error-id.js";
import { statusMessagesChecker } from "./status-messages.js";

export type { CheckerModule, CheckerFn, CheckerContext, CheckerResultData } from "./types.js";

/**
 * All §5.2 accessibility checkers — add to pipeline in order.
 *
 * Coverage:
 *  Automatable (via axe-core):
 *    5.2.7, 5.2.11, 5.2.13, 5.2.14, 5.2.18, 5.2.27, 5.2.28,
 *    5.2.31, 5.2.33, 5.2.36, 5.2.38, 5.2.45, 5.2.48, 5.2.49
 *  Semi-automatable:
 *    5.2.1, 5.2.3, 5.2.12, 5.2.15, 5.2.16, 5.2.17, 5.2.19,
 *    5.2.21, 5.2.22, 5.2.25, 5.2.26, 5.2.29, 5.2.30, 5.2.32,
 *    5.2.39, 5.2.42, 5.2.43, 5.2.44, 5.2.50
 *  Manual-only (surfaced in manual-review checklist only):
 *    5.2.2, 5.2.4, 5.2.5, 5.2.6, 5.2.9, 5.2.20, 5.2.23, 5.2.24,
 *    5.2.34, 5.2.35, 5.2.37, 5.2.40, 5.2.41, 5.2.46, 5.2.47
 */
export const accessibilityCheckers = [
  // Automatable — runs axe-core (14 clauses)
  axeCoreChecker,
  // Semi-automatable — one file per clause group
  textAlternativesChecker, // 5.2.1
  captionsChecker, // 5.2.3
  colourChecker, // 5.2.12
  reflowChecker, // 5.2.15, 5.2.17
  imagesOfTextChecker, // 5.2.16
  textSpacingChecker, // 5.2.19
  keyboardChecker, // 5.2.21, 5.2.22
  motionChecker, // 5.2.25
  flashingChecker, // 5.2.26
  focusOrderChecker, // 5.2.29
  linkPurposeChecker, // 5.2.30
  headingsChecker, // 5.2.32
  languagePartsChecker, // 5.2.39
  navigationChecker, // 5.2.42, 5.2.43
  errorIdChecker, // 5.2.44
  statusMessagesChecker, // 5.2.50
];
