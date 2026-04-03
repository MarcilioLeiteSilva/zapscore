export interface CompetitionConfig {
  code: string;
  externalId: number;
  name: string;
  country: string;
  type: 'league' | 'cup';
  activeSeasons: number[];
}

export const SUPPORTED_COMPETITIONS: CompetitionConfig[] = [
  {
    code: 'BR_SERIE_A',
    externalId: 71,
    name: 'Brasileirão Série A',
    country: 'Brazil',
    type: 'league',
    activeSeasons: [2026],
  },
  {
    code: 'BR_SERIE_B',
    externalId: 72,
    name: 'Brasileirão Série B',
    country: 'Brazil',
    type: 'league',
    activeSeasons: [2026],
  },
  {
    code: 'COPA_DO_BRASIL',
    externalId: 73,
    name: 'Copa do Brasil',
    country: 'Brazil',
    type: 'cup',
    activeSeasons: [2026],
  },
];

export const DEFAULT_COMPETITION = {
  leagueId: 71,
  season: 2026,
};
