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
