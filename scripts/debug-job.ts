import { prisma } from "../packages/db/src/index.js";

const id = process.argv[2];
if (!id) {
  console.error("Usage: npx tsx scripts/debug-job.ts <jobId>");
  process.exit(1);
}

const routes = await prisma.route.findMany({
  where: { jobId: id },
  select: { url: true, status: true, depth: true },
});
console.log(`\nRoutes for job ${id}:`);
for (const r of routes) {
  console.log(`  [${r.status}] depth=${String(r.depth)} ${r.url}`);
}

const checked = await prisma.checkerResult.groupBy({
  by: ["pageUrl"],
  where: { pageUrl: { in: routes.map((r) => r.url) } },
});
console.log(`\nPages with checker results (matching route URLs): ${String(checked.length)}`);
for (const c of checked) console.log(`  ${c.pageUrl}`);

const allResults = await prisma.checkerResult.count({ where: {} });
console.log(`\nTotal CheckerResult rows in DB: ${String(allResults)}`);

await prisma.$disconnect();
