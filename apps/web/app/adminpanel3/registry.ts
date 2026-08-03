import { Globe, Flag, Trophy } from 'lucide-react';

export interface LeagueConfig {
  id: number;
  slug: string;
  name: string;
  country: string;
  logo: string;
}

export const EUROPEAN_LEAGUES: LeagueConfig[] = [
  { id: 78, slug: 'bundesliga', name: 'Bundesliga', country: 'Alemanha', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 140, slug: 'laliga', name: 'La Liga', country: 'Espanha', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 39, slug: 'premier-league', name: 'Premier League', country: 'Inglaterra', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 135, slug: 'serie-a-italia', name: 'Serie A Itália', country: 'Itália', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 61, slug: 'ligue-1', name: 'Ligue 1', country: 'França', logo: 'https://media.api-sports.io/football/leagues/61.png' },
];
