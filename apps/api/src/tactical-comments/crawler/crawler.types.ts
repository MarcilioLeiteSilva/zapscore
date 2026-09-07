export type EventType =
  | 'GOL'
  | 'CARTAO'
  | 'DEFESA'
  | 'FINALIZACAO'
  | 'FALTA'
  | 'SUBSTITUICAO'
  | 'VAR'
  | 'LANCE';

export interface MatchLiveTimelineEvent {
  minute: number;
  half: '1T' | '2T' | 'INT' | 'FIM';
  type: EventType;
  description: string;
  source: string;
  protagonists?: string[];
  team?: string;
}

export interface SourceCrawlResult {
  sourceName: string;
  latestMinute: number;
  events: MatchLiveTimelineEvent[];
  headlines?: string[];
  success: boolean;
  error?: string;
}

export interface MultiSourceLiveDelta {
  currentMatchMinute: number;
  maxActiveMinute: number;
  leadSource: string;
  deltaEvents: MatchLiveTimelineEvent[];
  cumulativeDiscipline: string[];
  cumulativeSubstitutions: string[];
  pressHighlights: string[];
  rawSummary: string;
}

export interface FixtureBroadcastRecord {
  id?: string;
  fixture_id: number;
  league_id: number;
  match_title?: string;
  tv_open?: string;
  tv_closed?: string;
  streaming?: string;
  details?: string;
  source_url?: string;
  created?: string;
  updated?: string;
}

