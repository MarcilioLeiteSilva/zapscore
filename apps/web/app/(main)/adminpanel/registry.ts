import { Globe, Flag, Trophy, Newspaper, Video, ShieldCheck, LayoutDashboard, Database } from 'lucide-react';

export interface LeagueConfig {
  id: number;
  slug: string;
  name: string;
  country: string;
  flag: string;
}

export interface EcosystemModule {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  badge: string;
  badgeColor: string;
  href: string;
  dbType: 'pocketbase' | 'supabase' | 'rest';
  dbUrl?: string;
  leagues: LeagueConfig[];
}

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  {
    id: 'europa',
    name: 'Módulo Europa',
    shortName: 'Europa',
    icon: Globe,
    badge: 'PocketBase',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    href: '/adminpanel/europa',
    dbType: 'pocketbase',
    dbUrl: 'https://zapscore-pocketbase-europa.gtalg3.easypanel.host',
    leagues: [
      { id: 78, slug: 'bundesliga', name: 'Bundesliga', country: 'Alemanha', flag: '🇩🇪' },
      { id: 140, slug: 'laliga', name: 'La Liga', country: 'Espanha', flag: '🇪🇸' },
      { id: 39, slug: 'premier-league', name: 'Premier League', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { id: 135, slug: 'serie-a-italia', name: 'Serie A Itália', country: 'Itália', flag: '🇮🇹' },
      { id: 61, slug: 'ligue-1', name: 'Ligue 1', country: 'França', flag: '🇫🇷' },
    ],
  },
  {
    id: 'estaduais',
    name: 'Módulo Estaduais',
    shortName: 'Estaduais',
    icon: Flag,
    badge: 'Zapscore API',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    href: '/adminpanel/estaduais',
    dbType: 'rest',
    leagues: [
      { id: 629, slug: 'mineiro-1', name: 'Mineiro Módulo 1', country: 'Minas Gerais', flag: '🔺' },
      { id: 619, slug: 'mineiro-2', name: 'Mineiro Módulo 2', country: 'Minas Gerais', flag: '🔺' },
      { id: 624, slug: 'carioca-a', name: 'Carioca Série A', country: 'Rio de Janeiro', flag: '🌊' },
      { id: 851, slug: 'carioca-a2', name: 'Carioca Série A2', country: 'Rio de Janeiro', flag: '🌊' },
      { id: 475, slug: 'paulista-a1', name: 'Paulista Série A1', country: 'São Paulo', flag: '🏙️' },
      { id: 476, slug: 'paulista-a2', name: 'Paulista Série A2', country: 'São Paulo', flag: '🏙️' },
    ],
  },
  {
    id: 'brasil',
    name: 'Brasil & Estaduais',
    shortName: 'Brasil',
    icon: Flag,
    badge: 'Supabase',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
    href: '/adminpanel/brasil',
    dbType: 'supabase',
    leagues: [
      { id: 71, slug: 'brasileirao-a', name: 'Brasileirão Série A', country: 'Brasil', flag: '🇧🇷' },
      { id: 475, slug: 'paulistao', name: 'Paulistão', country: 'Brasil (SP)', flag: '🇧🇷' },
      { id: 476, slug: 'cariocao', name: 'Cariocão', country: 'Brasil (RJ)', flag: '🇧🇷' },
    ],
  },
  {
    id: 'copas',
    name: 'Copas & Torneios',
    shortName: 'Copas',
    icon: Trophy,
    badge: 'Multi-API',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    href: '/adminpanel/copas',
    dbType: 'rest',
    leagues: [
      { id: 13, slug: 'libertadores', name: 'Copa Libertadores', country: 'América do Sul', flag: '🏆' },
      { id: 2, slug: 'champions-league', name: 'UEFA Champions League', country: 'Europa', flag: '🇪🇺' },
      { id: 73, slug: 'copa-do-brasil', name: 'Copa do Brasil', country: 'Brasil', flag: '🇧🇷' },
    ],
  },
];
