import { Globe, Trophy, Flag, ShieldCheck } from 'lucide-react';

export interface EcosystemModule {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  href: string;
  badge: string;
  badgeColor: string;
  description: string;
  leagues: Array<{ id: number; name: string; country: string; flag: string }>;
}

export const EUROPEAN_LEAGUES = [
  { id: 2, slug: 'champions-league', name: 'Champions League', country: 'Europa', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 78, slug: 'bundesliga', name: 'Bundesliga', country: 'Alemanha', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 140, slug: 'laliga', name: 'La Liga', country: 'Espanha', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 39, slug: 'premier-league', name: 'Premier League', country: 'Inglaterra', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 135, slug: 'serie-a-italia', name: 'Serie A Itália', country: 'Itália', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 61, slug: 'ligue-1', name: 'Ligue 1', country: 'França', logo: 'https://media.api-sports.io/football/leagues/61.png' },
];

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  {
    id: 'europa',
    name: 'Módulo Europa',
    shortName: 'Europa (PocketBase)',
    icon: Globe,
    href: '/adminpanel2/europa',
    badge: 'PocketBase',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Suíte de Ligas Europeias integradas ao PocketBase backend.',
    leagues: [
      { id: 2, name: 'Champions League', country: 'Europa', flag: '⭐' },
      { id: 78, name: 'Bundesliga', country: 'Alemanha', flag: '🇩🇪' },
      { id: 140, name: 'La Liga', country: 'Espanha', flag: '🇪🇸' },
      { id: 39, name: 'Premier League', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { id: 61, name: 'Ligue 1', country: 'França', flag: '🇫🇷' },
      { id: 135, name: 'Serie A', country: 'Itália', flag: '🇮🇹' },
    ],
  },
];
