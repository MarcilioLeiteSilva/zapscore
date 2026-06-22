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
  {
    code: 'COPA_DO_NORDESTE',
    externalId: 612,
    name: 'Copa do Nordeste',
    country: 'Brazil',
    type: 'cup',
    activeSeasons: [2026],
  },
  {
    code: 'FIFA_WORLD_CUP',
    externalId: 1,
    name: 'Copa do Mundo FIFA',
    country: 'World',
    type: 'cup',
    activeSeasons: [2026],
  },
  {
    code: 'LIBERTADORES',
    externalId: 13,
    name: 'Copa Libertadores',
    country: 'World',
    type: 'cup',
    activeSeasons: [2026],
  },
  {
    code: 'AMISTOSOS_INT',
    externalId: 10,
    name: 'Amistosos Internacionais',
    country: 'World',
    type: 'cup',
    activeSeasons: [2026],
  },
  {
    code: 'BR_MINEIRO_1',
    externalId: 629,
    name: 'Campeonato Mineiro Módulo 1',
    country: 'Brazil',
    type: 'league',
    activeSeasons: [2026],
  },
  {
    code: 'BR_MINEIRO_2',
    externalId: 619,
    name: 'Campeonato Mineiro Módulo 2',
    country: 'Brazil',
    type: 'league',
    activeSeasons: [2026],
  },
];

export const DEFAULT_COMPETITION = {
  leagueId: 71,
  season: 2026,
};
