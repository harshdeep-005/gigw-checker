import { describe, it, expect } from "vitest";
import { normaliseUrl, isSameDomain, resolveHref, extractOrigin } from "./url-utils.js";

describe("normaliseUrl", () => {
  it("returns null for non-URL strings", () => {
    expect(normaliseUrl("not a url")).toBeNull();
    expect(normaliseUrl("")).toBeNull();
  });

  it("returns null for non-http/https schemes", () => {
    expect(normaliseUrl("mailto:test@example.com")).toBeNull();
    expect(normaliseUrl("ftp://example.gov.in/file")).toBeNull();
    expect(normaliseUrl("javascript:void(0)")).toBeNull();
  });

  it("strips fragments", () => {
    expect(normaliseUrl("https://example.gov.in/page#section")).toBe("https://example.gov.in/page");
  });

  it("lowercases scheme and host", () => {
    expect(normaliseUrl("HTTPS://EXAMPLE.GOV.IN/page")).toBe("https://example.gov.in/page");
  });

  it("removes trailing slash on non-root paths", () => {
    expect(normaliseUrl("https://example.gov.in/about/")).toBe("https://example.gov.in/about");
  });

  it("preserves trailing slash on root", () => {
    const result = normaliseUrl("https://example.gov.in/");
    expect(result).toBe("https://example.gov.in/");
  });

  it("sorts query params", () => {
    const a = normaliseUrl("https://example.gov.in/search?z=1&a=2");
    const b = normaliseUrl("https://example.gov.in/search?a=2&z=1");
    expect(a).toBe(b);
  });
});

describe("isSameDomain", () => {
  it("returns true for same hostname", () => {
    expect(isSameDomain("https://example.gov.in/about", "https://example.gov.in")).toBe(true);
  });

  it("returns false for different hostname", () => {
    expect(isSameDomain("https://other.gov.in/page", "https://example.gov.in")).toBe(false);
  });

  it("handles relative hrefs resolved against origin", () => {
    expect(isSameDomain("/about", "https://example.gov.in")).toBe(true);
  });

  it("returns false for off-domain href", () => {
    expect(isSameDomain("https://other.nic.in/page", "https://example.gov.in")).toBe(false);
  });
});

describe("resolveHref", () => {
  it("resolves relative href against base", () => {
    expect(resolveHref("/about", "https://example.gov.in/home")).toBe(
      "https://example.gov.in/about",
    );
  });

  it("returns absolute hrefs unchanged", () => {
    expect(resolveHref("https://example.gov.in/page", "https://example.gov.in")).toBe(
      "https://example.gov.in/page",
    );
  });

  it("returns null for non-http schemes", () => {
    expect(resolveHref("mailto:a@b.com", "https://example.gov.in")).toBeNull();
    expect(resolveHref("javascript:void(0)", "https://example.gov.in")).toBeNull();
  });
});

describe("extractOrigin", () => {
  it("extracts origin correctly", () => {
    expect(extractOrigin("https://example.gov.in/some/path?q=1")).toBe("https://example.gov.in");
  });

  it("returns null for invalid URL", () => {
    expect(extractOrigin("not a url")).toBeNull();
  });
});
