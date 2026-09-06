import { SourceCrawlResult } from '../crawler.types';

export interface IMatchLiveSourceAdapter {
  readonly sourceName: string;
  crawlMatchTimeline(
    homeTeam: string,
    awayTeam: string,
    referenceMinute?: number,
  ): Promise<SourceCrawlResult>;
}
