export type CommentPhase = 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME';

export type CommentSentiment =
  | 'EQUILIBRADO'
  | 'DOMINANTE'
  | 'CRITICO'
  | 'SURPRESA'
  | 'BALANCED'
  | 'DOMINANT'
  | 'CRITICAL'
  | 'SURPRISE';

export interface FixtureCommentRecord {
  id?: string;
  fixture_id: number;
  league_id: number;
  minute?: number;
  phase: CommentPhase;
  title: string;
  comment: string;
  sentiment?: CommentSentiment;
  stats_snapshot?: Record<string, any>;
  created?: string;
  updated?: string;
}

export interface GenerateCommentDto {
  phase?: CommentPhase;
  minute?: number;
  externalContextUrl?: string;
}

export interface TacticalAgentResponse {
  success: boolean;
  message?: string;
  data?: FixtureCommentRecord;
}

export interface TacticalPromptConfig {
  id?: string;
  coach_vs_fan: number; // 0 (100% Tecnico) a 100 (100% Torcedor)
  casualness: number; // 0 (formal) a 100 (resenha pura)
  live_length: 'FLASH' | 'SHORT' | 'NORMAL';
  pause_length: 'SUMMARY' | 'DEEP';
  focus_highlights: boolean;
  focus_table_impact: boolean;
  focus_substitutions: boolean;
  enable_crawl4ai?: boolean;
  crawl_sources?: string;
  custom_rules?: string;
}
