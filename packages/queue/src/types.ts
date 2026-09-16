import type { CrawlOptions } from "@gigw/crawler";

export interface CrawlJobPayload {
  jobId: string;
  options: CrawlOptions;
}

export interface CheckJobPayload {
  jobId: string;
  routeUrl: string;
  depth: number;
}
