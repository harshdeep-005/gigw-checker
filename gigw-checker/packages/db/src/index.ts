/**
 * @gigw/db
 *
 * Re-exports a singleton Prisma client and all generated types.
 * Every other package imports from here — never instantiate PrismaClient directly.
 *
 * Owned by: shared (both members). See design.md §2.
 */

import { PrismaClient } from "@prisma/client";

// Singleton — reuse across hot-reload in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export all Prisma-generated types so consumers don't need @prisma/client directly
export type {
  ClauseDefinition,
  CheckerResult,
  Route,
  PageReport,
  SiteReport,
  CrawlJob,
} from "@prisma/client";

export {
  ClauseCategory,
  ClauseAutomation,
  CheckStatus,
  Severity,
  RouteStatus,
  JobStatus,
} from "@prisma/client";
