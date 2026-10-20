/**
 * @gigw/checker-cybersecurity
 *
 * All Section 5.3 (Cybersecurity) checkers.
 * Owner: Member A. See requirements.md §6 for clause table.
 *
 * ⚠️  PASSIVE ONLY — requirements.md §7 is the hard boundary.
 *    No active scanning, probing, or exploit techniques of any kind.
 *    This is a legal constraint (IT Act 2000 §43/66), not a style preference.
 *
 * Coverage:
 *  Automatable:
 *    5.3.1-code-headers (HTTP header disclosure)
 *    5.3.1-code-cookies (Secure + HttpOnly flags)
 *    5.3.2-tls, 5.3.2-https, 5.3.2-ciphers (TLS/HTTPS/HSTS/mixed-content)
 *  Semi-automatable:
 *    5.3.1-code-errors (natural 404 page — A-013)
 *    5.3.1-code-tls-comms (3rd-party API encryption — A-013)
 *    5.3.2-waf (WAF presence inference — A-013)
 *    5.3.3 (policy pages presence — A-013)
 *  Manual-only (surfaced in manual-review checklist only):
 *    5.3.1, 5.3.1-code-mfa, 5.3.2, all 5.3.1-code-* (internal),
 *    all 5.3.1-db-*, all 5.3.2-* (hosting)
 */

import { headersChecker } from "./headers.js";
import { cookiesChecker } from "./cookies.js";
import { tlsChecker } from "./tls.js";
import { errorPageChecker } from "./error-page.js";
import { tlsCommsChecker } from "./tls-comms.js";
import { wafChecker } from "./waf.js";
import { policiesChecker } from "./policies.js";

export type { CheckerModule, CheckerFn, CheckerContext, CheckerResultData } from "./types.js";

/** All §5.3 cybersecurity checkers — passive only. */
export const cybersecurityCheckers = [
  // Automatable
  headersChecker, // 5.3.1-code-headers
  cookiesChecker, // 5.3.1-code-cookies
  tlsChecker, // 5.3.2-tls, 5.3.2-https, 5.3.2-ciphers
  // Semi-automatable
  errorPageChecker, // 5.3.1-code-errors
  tlsCommsChecker, // 5.3.1-code-tls-comms
  wafChecker, // 5.3.2-waf
  policiesChecker, // 5.3.3
];
