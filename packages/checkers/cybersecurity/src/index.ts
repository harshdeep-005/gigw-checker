/**
 * @gigw/checker-cybersecurity
 *
 * All Section 5.3 (Cybersecurity) checkers — PASSIVE ONLY.
 * Owner: Member A. See requirements.md §6 for clause table and
 * requirements.md §7 for the strict legal boundary on what may be tested.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  READ BEFORE ADDING ANY CHECKER TO THIS PACKAGE:                ║
 * ║  Every checker here must be passive (no probing, no scanning).  ║
 * ║  See requirements.md §7 — this is a legal boundary, not style.  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Planned checker files (one-file-per-clause-group, rules.md §5):
 *
 *   headers.ts     — 5.3.1-code-headers (response header inspection, auto)
 *   cookies.ts     — 5.3.1-code-cookies (Set-Cookie flag inspection, auto)
 *   tls.ts         — 5.3.2-tls, 5.3.2-https, 5.3.2-ciphers (TLS handshake, auto)
 *   error-page.ts  — 5.3.1-code-errors (natural 404 — NOT probing, semi)
 *   tls-comms.ts   — 5.3.1-code-tls-comms (visible network traffic, semi)
 *   waf.ts         — 5.3.2-waf (header/behaviour inference, semi)
 *   policies.ts    — 5.3.3 (policy page presence, semi)
 *
 * TODO (A-012, A-013): implement each file above. Do NOT start until
 * A-007 (accessibility proof-of-concept) is done — see tasks/member-a.md.
 */

export type { CheckerModule, CheckerContext, CheckerFn } from "./types.js";

export const cybersecurityCheckers: import("./types.js").CheckerModule[] = [
  // checkers will be imported and listed here as they are built (A-012, A-013)
];
