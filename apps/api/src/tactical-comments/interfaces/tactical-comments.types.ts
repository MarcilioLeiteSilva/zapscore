export type CommentPhase = 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME';

export type CommentSentiment = 'DOMINANT' | 'BALANCED' | 'CRITICAL' | 'SURPRISE';

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
