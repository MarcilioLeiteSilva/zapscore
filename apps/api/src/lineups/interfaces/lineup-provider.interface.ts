export interface NormalizedPlayer {
  player: string;
  number?: number;
  pos?: string; // G, D, M, F
  grid?: string;
  isStart: boolean;
  playerPhoto?: string;
  externalPlayerId?: number;
}

export interface NormalizedLineupResult {
  success: boolean;
  confirmed: boolean;
  source: 'sofascore' | 'fotmob' | 'globoesporte';
  formation?: {
    home?: string;
    away?: string;
  };
  homeTeam: {
    starters: NormalizedPlayer[];
    substitutes: NormalizedPlayer[];
  };
  awayTeam: {
    starters: NormalizedPlayer[];
    substitutes: NormalizedPlayer[];
  };
}

export interface ILineupProvider {
  readonly name: string;
  getLineup(params: {
    homeTeamName: string;
    awayTeamName: string;
    matchDate: Date;
    externalFixtureId: number;
    homeTeamExternalId: number;
    awayTeamExternalId: number;
  }): Promise<NormalizedLineupResult | null>;
}
