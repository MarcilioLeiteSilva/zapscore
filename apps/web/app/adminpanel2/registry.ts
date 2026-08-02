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
      { id: 78, name: 'Bundesliga', country: 'Alemanha', flag: '🇩🇪' },
      { id: 140, name: 'La Liga', country: 'Espanha', flag: '🇪🇸' },
      { id: 39, name: 'Premier League', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { id: 61, name: 'Ligue 1', country: 'França', flag: '🇫🇷' },
      { id: 135, name: 'Serie A', country: 'Itália', flag: '🇮🇹' },
    ],
  },
];
