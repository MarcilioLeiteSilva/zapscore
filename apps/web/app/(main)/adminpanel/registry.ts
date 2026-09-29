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
      { id: 2, slug: 'champions-league', name: 'Champions League', country: 'Europa', flag: '⭐' },
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
      { id: 477, slug: 'gaucho-1', name: 'Gaúcho Série A', country: 'Rio Grande do Sul', flag: '🧉' },
      { id: 478, slug: 'gaucho-2', name: 'Gaúcho Série A2', country: 'Rio Grande do Sul', flag: '🧉' },
      { id: 602, slug: 'baiano-1', name: 'Baiano 1ª Divisão', country: 'Bahia', flag: '☀️' },
      { id: 613, slug: 'baiano-2', name: 'Baiano 2ª Divisão', country: 'Bahia', flag: '☀️' },
      { id: 606, slug: 'paranaense-1', name: 'Paranaense 1ª Divisão', country: 'Paraná', flag: '🌲' },
      { id: 614, slug: 'paranaense-2', name: 'Paranaense 2ª Divisão', country: 'Paraná', flag: '🌲' },
      { id: 609, slug: 'cearense-1', name: 'Cearense Série A', country: 'Ceará', flag: '🌴' },
      { id: 620, slug: 'cearense-2', name: 'Cearense Série B', country: 'Ceará', flag: '🌴' },
      { id: 622, slug: 'pernambucano-1', name: 'Pernambucano 1ª Divisão', country: 'Pernambuco', flag: '🦁' },
      { id: 603, slug: 'paraibano-1', name: 'Paraibano 1ª Divisão', country: 'Paraíba', flag: '☀️' },
      { id: 608, slug: 'maranhense-1', name: 'Maranhense 1ª Divisão', country: 'Maranhão', flag: '🌴' },
      { id: 604, slug: 'catarinense-1', name: 'Catarinense 1ª Divisão', country: 'Santa Catarina', flag: '🌲' },
      { id: 611, slug: 'capixaba-1', name: 'Campeonato Capixaba', country: 'Espírito Santo', flag: '🏖️' },
      { id: 628, slug: 'goiano-1', name: 'Goiano 1ª Divisão', country: 'Goiás', flag: '🌾' },
      { id: 630, slug: 'matogrossense-1', name: 'Campeonato Matogrossense', country: 'Mato Grosso', flag: '🌿' },
      { id: 623, slug: 'sul-matogrossense-1', name: 'Campeonato Sul-Matogrossense', country: 'Mato Grosso do Sul', flag: '🐆' },
      { id: 610, slug: 'brasiliense-1', name: 'Campeonato Brasiliense', country: 'Distrito Federal', flag: '🏛️' },
      { id: 77, slug: 'alagoano-1', name: 'Campeonato Alagoano', country: 'Alagoas', flag: '🌴' },
      { id: 616, slug: 'potiguar-1', name: 'Campeonato Potiguar', country: 'Rio Grande do Norte', flag: '☀️' },
      { id: 621, slug: 'piauiense-1', name: 'Campeonato Piauiense', country: 'Piauí', flag: '🏜️' },
      { id: 626, slug: 'sergipano-1', name: 'Campeonato Sergipano', country: 'Sergipe', flag: '🦀' },
      { id: 627, slug: 'paraense-1', name: 'Campeonato Paraense', country: 'Pará', flag: '🦅' },
      { id: 522, slug: 'amazonense-1', name: 'Campeonato Amazonense', country: 'Amazonas', flag: '🌳' },
      { id: 520, slug: 'acreano-1', name: 'Campeonato Acreano', country: 'Acre', flag: '⭐' },
      { id: 521, slug: 'amapaense-1', name: 'Campeonato Amapaense', country: 'Amapá', flag: '🧭' },
      { id: 615, slug: 'rondoniense-1', name: 'Campeonato Rondoniense', country: 'Rondônia', flag: '🚂' },
      { id: 607, slug: 'roraimense-1', name: 'Campeonato Roraimense', country: 'Roraima', flag: '⛰️' },
      { id: 631, slug: 'tocantinense-1', name: 'Campeonato Tocantinense', country: 'Tocantins', flag: '🌞' },
    ],
  },
  {
    id: 'brasil',
    name: 'Módulo Brasil',
    shortName: 'Brasil',
    icon: Flag,
    badge: 'Zapscore API',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
    href: '/adminpanel/brasil',
    dbType: 'rest',
    leagues: [
      { id: 71, slug: 'brasileirao-a', name: 'Brasileirão Série A', country: 'Brasil', flag: '🇧🇷' },
      { id: 72, slug: 'brasileirao-b', name: 'Brasileirão Série B', country: 'Brasil', flag: '🇧🇷' },
    ],
  },
  {
    id: 'copas',
    name: 'Módulo Copas',
    shortName: 'Copas',
    icon: Trophy,
    badge: 'Zapscore API',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    href: '/adminpanel/copas',
    dbType: 'rest',
    leagues: [
      { id: 13, slug: 'libertadores', name: 'Copa Libertadores', country: 'América do Sul', flag: '🏆' },
      { id: 612, slug: 'copa-do-nordeste', name: 'Copa do Nordeste', country: 'Brasil (Nordeste)', flag: '☀️' },
      { id: 73, slug: 'copa-do-brasil', name: 'Copa do Brasil', country: 'Brasil', flag: '🇧🇷' },
    ],
  },
];
