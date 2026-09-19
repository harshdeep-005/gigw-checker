/**
 * BFS crawler core.
 *
 * Accepts a CrawlOptions + jobId, crawls same-domain routes using
 * Playwright, respects robots.txt, enforces depth + page caps,
 * retries failed pages, and writes Route records to DB via @gigw/db.
 *
 * Design spec: design.md §2, §6
 * DB shapes:   schema.md §4
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { prisma } from "@gigw/db";
import type { RouteStatus } from "@gigw/db";
import { normaliseUrl, isSameDomain, resolveHref, extractOrigin } from "./url-utils.js";
import { fetchRobotsRules, isAllowedByRobots } from "./robots.js";
import type { CrawlOptions, CrawlResult } from "./types.js";

interface QueueEntry {
  url: string;
  depth: number;
  discoveredFrom: string | null;
}

const DEFAULT_OPTIONS = {
  depthCap: 5,
  pageCap: 500,
  timeoutMs: 15_000,
  retries: 2,
} as const;

/**
 * Crawl a site starting from seedUrl.
 * Writes Route records to DB as pages are discovered and visited.
 * Returns a CrawlResult summary.
 */
export async function crawl(jobId: string, options: CrawlOptions): Promise<CrawlResult> {
  const {
    seedUrl,
    depthCap = DEFAULT_OPTIONS.depthCap,
    pageCap = DEFAULT_OPTIONS.pageCap,
    timeoutMs = DEFAULT_OPTIONS.timeoutMs,
    retries = DEFAULT_OPTIONS.retries,
  } = options;

  const normSeed = normaliseUrl(seedUrl);
  if (!normSeed) throw new Error(`Invalid seed URL: ${seedUrl}`);

  const origin = extractOrigin(normSeed);
  if (!origin) throw new Error(`Could not extract origin from: ${seedUrl}`);

  const robotsRules = await fetchRobotsRules(origin);

  const visited = new Set<string>();
  const queue: QueueEntry[] = [{ url: normSeed, depth: 0, discoveredFrom: null }];
  visited.add(normSeed);

  let routesDiscovered = 0;
  let routesFailed = 0;

  const browser: Browser = await chromium.launch({ headless: true });
  // newContext() is required — axe-core/playwright fails on pages not created from a context
  const context: BrowserContext = await browser.newContext();

  try {
    while (queue.length > 0 && routesDiscovered < pageCap) {
      const entry = queue.shift();
      if (!entry) break;
      const { url, depth, discoveredFrom } = entry;

      let pathname: string;
      try {
        pathname = new URL(url).pathname;
      } catch {
        continue;
      }

      if (!isAllowedByRobots(pathname, robotsRules)) {
        await upsertRoute(jobId, {
          url,
          depth,
          discoveredFrom,
          status: "skipped",
          httpStatus: null,
        });
        continue;
      }

      routesDiscovered++;

      const { httpStatus, links, status } = await visitPageWithRetry(
        context,
        url,
        timeoutMs,
        retries,
      );

      if (status === "error") routesFailed++;

      await upsertRoute(jobId, { url, depth, discoveredFrom, status, httpStatus });

      if (status !== "error" && depth < depthCap) {
        for (const href of links) {
          const resolved = resolveHref(href, url);
          if (!resolved) continue;
          if (!isSameDomain(resolved, origin)) continue;

          const normalised = normaliseUrl(resolved);
          if (!normalised) continue;
          if (visited.has(normalised)) continue;
          if (visited.size + queue.length >= pageCap) break;

          visited.add(normalised);
          queue.push({ url: normalised, depth: depth + 1, discoveredFrom: url });
        }
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return { jobId, routesDiscovered, routesFailed };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface VisitResult {
  httpStatus: number | null;
  links: string[];
  status: "crawled" | "error";
}

async function visitPageWithRetry(
  context: BrowserContext,
  url: string,
  timeoutMs: number,
  retries: number,
): Promise<VisitResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const page: Page = await context.newPage();
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });

      const httpStatus = response?.status() ?? null;
      const links = await extractLinks(page);
      return { httpStatus, links, status: "crawled" };
    } catch (err) {
      lastError = err;
    } finally {
      await page.close();
    }
  }

  console.error(`[crawler] Failed after ${String(retries + 1)} attempts: ${url}`, lastError);
  return { httpStatus: null, links: [], status: "error" };
}

async function extractLinks(page: Page): Promise<string[]> {
  try {
    return await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => (a as HTMLAnchorElement).href).filter((h) => h.length > 0),
    );
  } catch {
    return [];
  }
}

interface RouteWriteInput {
  url: string;
  depth: number;
  discoveredFrom: string | null;
  status: RouteStatus;
  httpStatus: number | null;
}

async function upsertRoute(jobId: string, input: RouteWriteInput): Promise<void> {
  await prisma.route.upsert({
    where: { jobId_url: { jobId, url: input.url } },
    create: {
      jobId,
      url: input.url,
      depth: input.depth,
      discoveredFrom: input.discoveredFrom,
      status: input.status,
      httpStatus: input.httpStatus,
      crawledAt: new Date(),
    },
    update: {
      status: input.status,
      httpStatus: input.httpStatus,
      crawledAt: new Date(),
    },
  });
}
