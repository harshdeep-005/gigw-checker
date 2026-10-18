/**
 * Unit tests for quality-lifecycle PoC checkers.
 * Uses mock CheckerContext (html string + minimal page stub) — no Playwright needed.
 * Owner: Member B (B-012).
 */

import { describe, it, expect } from "vitest";
import { officialDomainChecker } from "./official-domain.js";
import { metadataChecker } from "./metadata.js";
import type { CheckerContext } from "./types.js";
import type { Page } from "playwright";

// Minimal Page stub — checkers under test don't call page methods
const mockPage = {} as Page;

function makeCtx(pageUrl: string, html: string): CheckerContext {
  return { page: mockPage, pageUrl, html };
}

// ── officialDomainChecker ────────────────────────────────────────────────────

describe("officialDomainChecker — 5.1.1", () => {
  it("passes for .gov.in domain", async () => {
    const ctx = makeCtx("https://uidai.gov.in/", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("pass");
    expect(results[0]?.clauseId).toBe("5.1.1");
    expect(results[0]?.severity).toBe("high");
  });

  it("passes for .nic.in domain", async () => {
    const ctx = makeCtx("https://mha.nic.in/page", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.status).toBe("pass");
  });

  it("passes for subdomain of .gov.in", async () => {
    const ctx = makeCtx("https://services.india.gov.in/", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.status).toBe("pass");
  });

  it("fails for non-government domain", async () => {
    const ctx = makeCtx("https://example.com/", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.status).toBe("fail");
    expect(results[0]?.evidence).toContain("example.com");
  });

  it("fails for domain that merely contains .gov.in in path", async () => {
    const ctx = makeCtx("https://example.com/gov.in/", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.status).toBe("fail");
  });

  it("fails for hostname that has .gov.in as an inner segment, not a suffix", async () => {
    // e.g. gov.in.malicious.com — .gov.in is not at the end
    const ctx = makeCtx("https://gov.in.malicious.com/", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.status).toBe("fail");
  });

  it("returns exactly one result regardless of input", async () => {
    const ctx = makeCtx("https://uidai.gov.in/some/deep/path?q=1#frag", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results).toHaveLength(1);
  });

  it("result has required CheckerResult shape fields", async () => {
    const ctx = makeCtx("https://uidai.gov.in/", "");
    const results = await officialDomainChecker.run(ctx);
    const r = results[0];
    expect(r).toBeDefined();
    expect(typeof r?.clauseId).toBe("string");
    expect(typeof r?.pageUrl).toBe("string");
    expect(typeof r?.evidence).toBe("string");
    expect(r?.checkedAt).toBeInstanceOf(Date);
    expect(["pass", "fail", "needs_review", "not_applicable"]).toContain(r?.status);
    expect(["high", "medium", "low"]).toContain(r?.severity);
  });

  it("evidence contains the hostname on fail", async () => {
    const ctx = makeCtx("https://badsite.org/", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.evidence).toContain("badsite.org");
  });

  it("passes for deeply nested subdomain of .nic.in", async () => {
    const ctx = makeCtx("https://sub.dept.mha.nic.in/page", "");
    const results = await officialDomainChecker.run(ctx);
    expect(results[0]?.status).toBe("pass");
  });
});

// ── metadataChecker ──────────────────────────────────────────────────────────

const FULL_META_HTML = `
<html>
  <head>
    <title>Ministry of Home Affairs</title>
    <meta name="description" content="Official website of the Ministry of Home Affairs, Government of India">
    <meta name="keywords" content="MHA, home affairs, India, government">
  </head>
  <body></body>
</html>
`;

const MISSING_META_HTML = `
<html>
  <head>
    <title>  </title>
  </head>
  <body></body>
</html>
`;

describe("metadataChecker — 5.1.21", () => {
  it("returns 3 results (one per sub-check)", async () => {
    const ctx = makeCtx("https://mha.gov.in/", FULL_META_HTML);
    const results = await metadataChecker.run(ctx);
    expect(results).toHaveLength(3);
  });

  it("all pass when title, description, and keywords are present", async () => {
    const ctx = makeCtx("https://mha.gov.in/", FULL_META_HTML);
    const results = await metadataChecker.run(ctx);
    expect(results.every((r) => r.status === "pass")).toBe(true);
    expect(results.every((r) => r.clauseId === "5.1.21")).toBe(true);
    expect(results.every((r) => r.severity === "medium")).toBe(true);
  });

  it("fails all three when metadata is missing", async () => {
    const ctx = makeCtx("https://mha.gov.in/", MISSING_META_HTML);
    const results = await metadataChecker.run(ctx);
    expect(results.every((r) => r.status === "fail")).toBe(true);
  });

  it("passes title but fails description and keywords when only title present", async () => {
    const html = "<html><head><title>Some Page</title></head><body></body></html>";
    const ctx = makeCtx("https://mha.gov.in/", html);
    const results = await metadataChecker.run(ctx);

    const byCheck = Object.fromEntries(
      results.map((r) => [(r.detail as { subCheck: string }).subCheck, r.status]),
    );
    expect(byCheck["page-title"]).toBe("pass");
    expect(byCheck["meta-description"]).toBe("fail");
    expect(byCheck["meta-keywords"]).toBe("fail");
  });

  it("handles attribute order variation in meta tags", async () => {
    // content before name
    const html = `
      <html><head>
        <title>Test</title>
        <meta content="A description" name="description">
        <meta content="kw1, kw2" name="keywords">
      </head><body></body></html>
    `;
    const ctx = makeCtx("https://mha.gov.in/", html);
    const results = await metadataChecker.run(ctx);
    expect(results.every((r) => r.status === "pass")).toBe(true);
  });

  it("fails title when it is whitespace-only", async () => {
    // Title tag exists but only contains spaces/newlines — not meaningful
    const html = "<html><head><title>   \n\t  </title></head><body></body></html>";
    const ctx = makeCtx("https://mha.gov.in/", html);
    const results = await metadataChecker.run(ctx);
    const byCheck = Object.fromEntries(
      results.map((r) => [(r.detail as { subCheck: string }).subCheck, r.status]),
    );
    expect(byCheck["page-title"]).toBe("fail");
  });

  it("fails meta-description when content attribute is empty string", async () => {
    const html = `<html><head>
      <title>Good Title</title>
      <meta name="description" content="">
      <meta name="keywords" content="kw1">
    </head><body></body></html>`;
    const ctx = makeCtx("https://mha.gov.in/", html);
    const results = await metadataChecker.run(ctx);
    const byCheck = Object.fromEntries(
      results.map((r) => [(r.detail as { subCheck: string }).subCheck, r.status]),
    );
    expect(byCheck["meta-description"]).toBe("fail");
    // others unaffected
    expect(byCheck["page-title"]).toBe("pass");
    expect(byCheck["meta-keywords"]).toBe("pass");
  });

  it("fails all three when there is no <head> tag at all", async () => {
    const html = "<html><body><p>No head here</p></body></html>";
    const ctx = makeCtx("https://mha.gov.in/", html);
    const results = await metadataChecker.run(ctx);
    expect(results.every((r) => r.status === "fail")).toBe(true);
  });

  it("each result has the correct pageUrl and clauseId", async () => {
    const url = "https://mha.gov.in/somepage";
    const ctx = makeCtx(url, FULL_META_HTML);
    const results = await metadataChecker.run(ctx);
    expect(results.every((r) => r.pageUrl === url)).toBe(true);
    expect(results.every((r) => r.clauseId === "5.1.21")).toBe(true);
  });

  it("detail field contains subCheck name and extracted value on pass", async () => {
    const ctx = makeCtx("https://mha.gov.in/", FULL_META_HTML);
    const results = await metadataChecker.run(ctx);
    for (const r of results) {
      const detail = r.detail as { subCheck: string; value: string | null };
      expect(typeof detail.subCheck).toBe("string");
      expect(detail.value).not.toBeNull();
    }
  });

  it("detail.value is null when the meta tag is absent, empty string when tag exists but is blank", async () => {
    // MISSING_META_HTML has <title>  </title> (whitespace) but no meta tags
    const ctx = makeCtx("https://mha.gov.in/", MISSING_META_HTML);
    const results = await metadataChecker.run(ctx);
    const byCheck = Object.fromEntries(
      results.map((r) => {
        const d = r.detail as { subCheck: string; value: string | null };
        return [d.subCheck, d.value];
      }),
    );
    // title tag present but whitespace-only → value is "" (empty string after trim)
    expect(byCheck["page-title"]).toBe("");
    // meta tags entirely absent → regex returns null → value is null
    expect(byCheck["meta-description"]).toBeNull();
    expect(byCheck["meta-keywords"]).toBeNull();
  });
});
