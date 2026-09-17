/**
 * URL utilities for the crawler.
 * Pure functions — no I/O, fully unit-testable.
 */

/**
 * Normalise a URL for deduplication:
 *  - Remove fragment (#...)
 *  - Remove trailing slash on non-root paths
 *  - Lowercase scheme + host
 *  - Sort query params for consistent representation
 *
 * Returns null if the string is not a valid URL.
 */
export function normaliseUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  // Only crawl http/https
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.protocol = url.protocol.toLowerCase();

  // Sort query params for consistent dedup
  url.searchParams.sort();

  // Remove trailing slash on non-root paths
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

/**
 * Returns true if `href` is on the same hostname as `seedUrl`.
 * Handles relative hrefs by resolving against the seed's origin.
 */
export function isSameDomain(href: string, seedOrigin: string): boolean {
  try {
    const url = new URL(href, seedOrigin);
    const seed = new URL(seedOrigin);
    return url.hostname.toLowerCase() === seed.hostname.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Resolve a potentially-relative href against a base URL.
 * Returns null if not resolvable or not http/https.
 */
export function resolveHref(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Extract origin (scheme + host + port) from a URL string.
 * Returns null if invalid.
 */
export function extractOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
