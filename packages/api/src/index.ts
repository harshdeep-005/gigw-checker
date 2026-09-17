/**
 * @gigw/api
 *
 * Fastify v5 HTTP API.
 *  POST /jobs        — submit a seed URL, create CrawlJob, enqueue crawl
 *  GET  /jobs/:id    — poll job status
 *  GET  /reports/:id — fetch completed SiteReport
 *  GET  /health      — liveness probe
 *
 * Owned by: shared (both members). See design.md §2.
 */

import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@gigw/db";
import { addCrawlJob } from "@gigw/queue";

// ── Domain validation ─────────────────────────────────────────────────────────

const ALLOWED_DOMAIN_RE = /\.(gov\.in|nic\.in)(:\d+)?$/i;

function isAllowedDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAIN_RE.test(hostname);
  } catch {
    return false;
  }
}

// ── App setup ─────────────────────────────────────────────────────────────────

const app = Fastify({ logger: true });

await app.register(cors, { origin: "*" });

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /health */
app.get("/health", () => ({ status: "ok" }));

/** POST /jobs — submit a seed URL for crawling */
interface CreateJobBody {
  seedUrl: string;
  depthCap?: number;
  pageCap?: number;
}

app.post("/jobs", async (request: FastifyRequest<{ Body: CreateJobBody }>, reply: FastifyReply) => {
  const body = request.body;
  const seedUrl = body.seedUrl;
  const depthCap = body.depthCap;
  const pageCap = body.pageCap;

  if (!seedUrl || typeof seedUrl !== "string") {
    return reply.status(400).send({ error: "seedUrl is required" });
  }

  if (!isAllowedDomain(seedUrl)) {
    return reply.status(400).send({
      error: "Only .gov.in and .nic.in domains are supported. " + `Received: ${seedUrl}`,
    });
  }

  // Create CrawlJob in DB
  const job = await prisma.crawlJob.create({
    data: { seedUrl, status: "queued" },
  });

  // Enqueue in BullMQ
  await addCrawlJob({
    jobId: job.id,
    options: {
      seedUrl,
      ...(depthCap !== undefined && { depthCap }),
      ...(pageCap !== undefined && { pageCap }),
    },
  });

  return reply.status(202).send({ jobId: job.id });
});

/** GET /jobs/:id — poll job status */
app.get(
  "/jobs/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const job = await prisma.crawlJob.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        seedUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!job) return reply.status(404).send({ error: "Job not found" });
    return job;
  },
);

/** GET /reports/:id — fetch completed SiteReport */
app.get(
  "/reports/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const report = await prisma.siteReport.findUnique({
      where: { id: request.params.id },
      include: {
        pages: {
          include: { results: true },
        },
      },
    });

    if (!report) return reply.status(404).send({ error: "Report not found" });
    return report;
  },
);

// ── Start ─────────────────────────────────────────────────────────────────────

await app.listen({ port: 3000, host: "0.0.0.0" });
