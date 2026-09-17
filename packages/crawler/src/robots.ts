/**
 * Minimal robots.txt parser.
 * Fetches and evaluates robots.txt rules for a given origin.
 * Only checks the User-agent: * block — we are not a named bot.
 */

export interface RobotsRules {
  disallow: string[];
  allow: string[];
}

const ROBOTS_CACHE = new Map<string, RobotsRules>();

/**
 * Fetch and parse robots.txt for the given origin (e.g. "https://example.gov.in").
 * Returns empty rules (allow everything) if robots.txt is missing or unreadable.
 * Results are cached per origin for the lifetime of the crawl.
 */
export async function fetchRobotsRules(origin: string): Promise<RobotsRules> {
  const cached = ROBOTS_CACHE.get(origin);
  if (cached) return cached;

  const rules: RobotsRules = { disallow: [], allow: [] };

  try {
    const res = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      ROBOTS_CACHE.set(origin, rules);
      return rules;
    }

    const text = await res.text();
    let inRelevantBlock = false;

    for (const raw of text.split("\n")) {
      const line = raw.trim();

      if (line.startsWith("#") || line === "") continue;

      const [field, ...rest] = line.split(":");
      const key = field?.trim().toLowerCase();
      const value = rest.join(":").trim();

      if (key === "user-agent") {
        inRelevantBlock = value === "*";
        continue;
      }

      if (!inRelevantBlock) continue;

      if (key === "disallow" && value) rules.disallow.push(value);
      if (key === "allow" && value) rules.allow.push(value);
    }
  } catch {
    // Network error or timeout — treat as allow all
  }

  ROBOTS_CACHE.set(origin, rules);
  return rules;
}

/**
 * Returns true if the given URL path is allowed for crawling.
 * Follows standard precedence: longer matching rule wins;
 * allow beats disallow of equal length.
 */
export function isAllowedByRobots(pathname: string, rules: RobotsRules): boolean {
  let bestMatch = { length: 0, allowed: true };

  for (const pattern of rules.disallow) {
    if (pathname.startsWith(pattern) && pattern.length >= bestMatch.length) {
      bestMatch = { length: pattern.length, allowed: false };
    }
  }

  for (const pattern of rules.allow) {
    if (pathname.startsWith(pattern) && pattern.length > bestMatch.length) {
      bestMatch = { length: pattern.length, allowed: true };
    }
  }

  return bestMatch.allowed;
}
