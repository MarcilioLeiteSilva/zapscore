export interface StateScoutMatch {
  homeTeamName: string;
  awayTeamName: string;
  date: Date;
  round: string;
  venueName?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isFinished: boolean;
  sourceId?: string;
}

export interface FederationDriver {
  readonly name: string;
  readonly leagueExternalId: number;
  readonly season: number;
  fetchSchedule(): Promise<StateScoutMatch[]>;
}

export interface StateScoutTelemetry {
  status: 'ONLINE' | 'STANDBY' | 'ERROR';
  lastRunTimestamp: string | null;
  lastScheduleReconciledCount: number;
  lastResultsReconciledCount: number;
  totalDatesCorrected: number;
  totalResultsSettled: number;
  activeDrivers: Array<{
    name: string;
    leagueExternalId: number;
    season: number;
    status: 'ACTIVE' | 'ERROR';
  }>;
  recentLogs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
  }>;
}
