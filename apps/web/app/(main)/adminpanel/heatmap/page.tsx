'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Flame,
  Users,
  TrendingUp,
  Smartphone,
  Calendar,
  Filter,
  RefreshCw,
  Building,
  ShieldCheck,
  Megaphone,
  ArrowUpRight,
  Activity,
  Tv,
  Table,
  Newspaper,
  Video,
  Sparkles,
  ChevronRight,
  Globe
} from 'lucide-react';

interface StateData {
  uf: string;
  name: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  users: number;
  percentage: number;
  heatLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  topCities: { name: string; users: number }[];
  favTeam: string;
  // SVG placement & label coordinates
  labelX: number;
  labelY: number;
  svgPath: string;
}

interface AppOption {
  id: string;
  name: string;
  stateFocus?: string;
  totalActive: number;
}

const APPS_LIST: AppOption[] = [
  { id: 'all', name: 'Todos os Apps (Ecossistema ZapScore)', totalActive: 142580 },
  { id: 'brasileirao', name: '🇧🇷 Brasileirão Série A', totalActive: 68400 },
  { id: 'paulista', name: '📍 Paulistão (SP)', stateFocus: 'SP', totalActive: 24800 },
  { id: 'carioca', name: '📍 Carioca (RJ)', stateFocus: 'RJ', totalActive: 18900 },
  { id: 'pernambucano', name: '📍 Pernambucano (PE)', stateFocus: 'PE', totalActive: 8900 },
  { id: 'mineiro', name: '📍 Mineiro (MG)', stateFocus: 'MG', totalActive: 9400 },
  { id: 'gaucho', name: '📍 Gauchão (RS)', stateFocus: 'RS', totalActive: 7800 },
  { id: 'baiano', name: '📍 Baiano (BA)', stateFocus: 'BA', totalActive: 6200 },
  { id: 'cearense', name: '📍 Cearense (CE)', stateFocus: 'CE', totalActive: 5100 },
  { id: 'paranaense', name: '📍 Paranaense (PR)', stateFocus: 'PR', totalActive: 4700 },
  { id: 'catarinense', name: '📍 Catarinense (SC)', stateFocus: 'SC', totalActive: 3900 },
  { id: 'goiano', name: '📍 Goiano (GO)', stateFocus: 'GO', totalActive: 3400 },
];

// Base geographic data and SVG polygon paths for the 27 Brazilian Federation Units
const BASE_STATES: Omit<StateData, 'users' | 'percentage' | 'heatLevel'>[] = [
  // Norte
  {
    uf: 'RR',
    name: 'Roraima',
    region: 'Norte',
    favTeam: 'Flamengo',
    topCities: [{ name: 'Boa Vista', users: 510 }, { name: 'Rorainópolis', users: 80 }],
    labelX: 165,
    labelY: 75,
    svgPath: 'M 135,45 L 185,40 L 195,105 L 140,110 Z',
  },
  {
    uf: 'AP',
    name: 'Amapá',
    region: 'Norte',
    favTeam: 'Flamengo',
    topCities: [{ name: 'Macapá', users: 840 }, { name: 'Santana', users: 190 }],
    labelX: 305,
    labelY: 100,
    svgPath: 'M 285,60 L 330,85 L 315,140 L 275,115 Z',
  },
  {
    uf: 'AM',
    name: 'Amazonas',
    region: 'Norte',
    favTeam: 'Amazonas FC / Flamengo',
    topCities: [{ name: 'Manaus', users: 3100 }, { name: 'Parintins', users: 340 }],
    labelX: 130,
    labelY: 190,
    svgPath: 'M 60,130 L 180,110 L 220,170 L 210,240 L 120,260 L 50,220 Z',
  },
  {
    uf: 'PA',
    name: 'Pará',
    region: 'Norte',
    favTeam: 'Paysandu / Remo',
    topCities: [{ name: 'Belém', users: 4800 }, { name: 'Ananindeua', users: 950 }, { name: 'Santarém', users: 780 }],
    labelX: 280,
    labelY: 175,
    svgPath: 'M 205,105 L 305,95 L 360,165 L 340,245 L 245,245 L 220,170 Z',
  },
  {
    uf: 'AC',
    name: 'Acre',
    region: 'Norte',
    favTeam: 'Flamengo / Vasco',
    topCities: [{ name: 'Rio Branco', users: 980 }, { name: 'Cruzeiro do Sul', users: 210 }],
    labelX: 75,
    labelY: 285,
    svgPath: 'M 35,260 L 95,260 L 110,295 L 65,310 Z',
  },
  {
    uf: 'RO',
    name: 'Rondônia',
    region: 'Norte',
    favTeam: 'Flamengo / Corinthians',
    topCities: [{ name: 'Porto Velho', users: 1650 }, { name: 'Ji-Paraná', users: 420 }],
    labelX: 155,
    labelY: 295,
    svgPath: 'M 110,265 L 175,255 L 190,325 L 130,335 Z',
  },
  {
    uf: 'TO',
    name: 'Tocantins',
    region: 'Norte',
    favTeam: 'Flamengo / Palmas',
    topCities: [{ name: 'Palmas', users: 1450 }, { name: 'Araguaína', users: 510 }],
    labelX: 345,
    labelY: 280,
    svgPath: 'M 325,215 L 365,215 L 370,330 L 330,340 L 320,250 Z',
  },

  // Nordeste
  {
    uf: 'MA',
    name: 'Maranhão',
    region: 'Nordeste',
    favTeam: 'Sampaio Corrêa',
    topCities: [{ name: 'São Luís', users: 3400 }, { name: 'Imperatriz', users: 890 }],
    labelX: 390,
    labelY: 190,
    svgPath: 'M 355,145 L 415,155 L 420,225 L 365,225 Z',
  },
  {
    uf: 'PI',
    name: 'Piauí',
    region: 'Nordeste',
    favTeam: 'River / Flamengo',
    topCities: [{ name: 'Teresina', users: 2450 }, { name: 'Parnaíba', users: 610 }],
    labelX: 420,
    labelY: 235,
    svgPath: 'M 415,170 L 450,185 L 435,275 L 395,270 L 405,215 Z',
  },
  {
    uf: 'CE',
    name: 'Ceará',
    region: 'Nordeste',
    favTeam: 'Fortaleza / Ceará',
    topCities: [{ name: 'Fortaleza', users: 5900 }, { name: 'Caucaia', users: 880 }, { name: 'Juazeiro do Norte', users: 740 }],
    labelX: 475,
    labelY: 195,
    svgPath: 'M 455,170 L 505,180 L 490,225 L 450,210 Z',
  },
  {
    uf: 'RN',
    name: 'Rio Grande do Norte',
    region: 'Nordeste',
    favTeam: 'ABC / América-RN',
    topCities: [{ name: 'Natal', users: 2950 }, { name: 'Mossoró', users: 780 }],
    labelX: 520,
    labelY: 205,
    svgPath: 'M 505,185 L 545,190 L 535,220 L 495,215 Z',
  },
  {
    uf: 'PB',
    name: 'Paraíba',
    region: 'Nordeste',
    favTeam: 'Botafogo-PB / Treze',
    topCities: [{ name: 'João Pessoa', users: 3100 }, { name: 'Campina Grande', users: 1200 }],
    labelX: 520,
    labelY: 232,
    svgPath: 'M 495,220 L 545,220 L 540,245 L 490,240 Z',
  },
  {
    uf: 'PE',
    name: 'Pernambuco',
    region: 'Nordeste',
    favTeam: 'Sport / Santa Cruz / Náutico',
    topCities: [{ name: 'Recife', users: 7400 }, { name: 'Jaboatão dos Guararapes', users: 1800 }, { name: 'Olinda', users: 1300 }, { name: 'Caruaru', users: 950 }],
    labelX: 495,
    labelY: 255,
    svgPath: 'M 455,235 L 540,245 L 530,270 L 440,265 Z',
  },
  {
    uf: 'AL',
    name: 'Alagoas',
    region: 'Nordeste',
    favTeam: 'CRB / CSA',
    topCities: [{ name: 'Maceió', users: 2800 }, { name: 'Arapiraca', users: 670 }],
    labelX: 520,
    labelY: 283,
    svgPath: 'M 505,270 L 535,270 L 525,295 L 500,290 Z',
  },
  {
    uf: 'SE',
    name: 'Sergipe',
    region: 'Nordeste',
    favTeam: 'Confiança / Sergipe',
    topCities: [{ name: 'Aracaju', users: 1950 }, { name: 'Nossa Senhora do Socorro', users: 430 }],
    labelX: 505,
    labelY: 308,
    svgPath: 'M 490,295 L 515,295 L 505,320 L 485,315 Z',
  },
  {
    uf: 'BA',
    name: 'Bahia',
    region: 'Nordeste',
    favTeam: 'Bahia / Vitória',
    topCities: [{ name: 'Salvador', users: 8900 }, { name: 'Feira de Santana', users: 1950 }, { name: 'Vitória da Conquista', users: 1100 }],
    labelX: 445,
    labelY: 335,
    svgPath: 'M 410,275 L 490,275 L 500,345 L 460,400 L 400,370 L 390,310 Z',
  },

  // Centro-Oeste
  {
    uf: 'MT',
    name: 'Mato Grosso',
    region: 'Centro-Oeste',
    favTeam: 'Cuiabá / Flamengo',
    topCities: [{ name: 'Cuiabá', users: 3800 }, { name: 'Várzea Grande', users: 980 }, { name: 'Rondonópolis', users: 670 }],
    labelX: 250,
    labelY: 330,
    svgPath: 'M 185,255 L 290,245 L 315,355 L 255,405 L 200,375 L 180,315 Z',
  },
  {
    uf: 'GO',
    name: 'Goiás',
    region: 'Centro-Oeste',
    favTeam: 'Goiás / Vila Nova / Atlético-GO',
    topCities: [{ name: 'Goiânia', users: 5800 }, { name: 'Aparecida de Goiânia', users: 1450 }, { name: 'Anápolis', users: 1100 }],
    labelX: 340,
    labelY: 385,
    svgPath: 'M 305,345 L 375,340 L 385,420 L 325,430 L 295,380 Z',
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    region: 'Centro-Oeste',
    favTeam: 'Flamengo / Vasco / Gama',
    topCities: [{ name: 'Brasília', users: 6400 }, { name: 'Taguatinga', users: 1250 }, { name: 'Ceilândia', users: 1400 }],
    labelX: 362,
    labelY: 376,
    svgPath: 'M 355,368 L 370,368 L 370,383 L 355,383 Z',
  },
  {
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    region: 'Centro-Oeste',
    favTeam: 'Corinthians / Palmeiras / Operário-MS',
    topCities: [{ name: 'Campo Grande', users: 3200 }, { name: 'Dourados', users: 890 }],
    labelX: 280,
    labelY: 440,
    svgPath: 'M 245,395 L 315,390 L 330,475 L 265,490 L 235,440 Z',
  },

  // Sudeste
  {
    uf: 'MG',
    name: 'Minas Gerais',
    region: 'Sudeste',
    favTeam: 'Atlético-MG / Cruzeiro / América-MG',
    topCities: [{ name: 'Belo Horizonte', users: 12400 }, { name: 'Uberlândia', users: 2400 }, { name: 'Contagem', users: 1850 }, { name: 'Juiz de Fora', users: 1400 }],
    labelX: 415,
    labelY: 425,
    svgPath: 'M 365,365 L 460,365 L 475,445 L 415,485 L 355,445 Z',
  },
  {
    uf: 'ES',
    name: 'Espírito Santo',
    region: 'Sudeste',
    favTeam: 'Flamengo / Vasco / Rio Branco-ES',
    topCities: [{ name: 'Vitória', users: 3100 }, { name: 'Vila Velha', users: 1650 }, { name: 'Serra', users: 1400 }],
    labelX: 480,
    labelY: 442,
    svgPath: 'M 465,415 L 495,425 L 485,465 L 460,455 Z',
  },
  {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    region: 'Sudeste',
    favTeam: 'Flamengo / Vasco / Fluminense / Botafogo',
    topCities: [{ name: 'Rio de Janeiro', users: 22800 }, { name: 'São Gonçalo', users: 2850 }, { name: 'Duque de Caxias', users: 2300 }, { name: 'Niterói', users: 2100 }],
    labelX: 445,
    labelY: 485,
    svgPath: 'M 420,470 L 470,465 L 455,495 L 410,490 Z',
  },
  {
    uf: 'SP',
    name: 'São Paulo',
    region: 'Sudeste',
    favTeam: 'Corinthians / Palmeiras / São Paulo / Santos',
    topCities: [{ name: 'São Paulo', users: 34500 }, { name: 'Guarulhos', users: 4200 }, { name: 'Campinas', users: 3900 }, { name: 'São Bernardo', users: 2800 }, { name: 'Santos', users: 2100 }],
    labelX: 360,
    labelY: 490,
    svgPath: 'M 315,455 L 405,450 L 410,505 L 345,525 L 310,485 Z',
  },

  // Sul
  {
    uf: 'PR',
    name: 'Paraná',
    region: 'Sul',
    favTeam: 'Athletico-PR / Coritiba / Operário-PR',
    topCities: [{ name: 'Curitiba', users: 6700 }, { name: 'Londrina', users: 1650 }, { name: 'Maringá', users: 1350 }],
    labelX: 345,
    labelY: 525,
    svgPath: 'M 300,500 L 385,495 L 380,545 L 305,545 Z',
  },
  {
    uf: 'SC',
    name: 'Santa Catarina',
    region: 'Sul',
    favTeam: 'Criciúma / Chapecoense / Avaí / Figueirense',
    topCities: [{ name: 'Florianópolis', users: 3800 }, { name: 'Joinville', users: 1950 }, { name: 'Blumenau', users: 1200 }],
    labelX: 348,
    labelY: 565,
    svgPath: 'M 305,545 L 380,545 L 375,580 L 315,585 Z',
  },
  {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    region: 'Sul',
    favTeam: 'Grêmio / Internacional / Juventude',
    topCities: [{ name: 'Porto Alegre', users: 9200 }, { name: 'Caxias do Sul', users: 2100 }, { name: 'Pelotas', users: 1300 }, { name: 'Canoas', users: 1100 }],
    labelX: 330,
    labelY: 615,
    svgPath: 'M 295,580 L 375,575 L 360,655 L 290,650 L 275,610 Z',
  },
];

export default function HeatmapAudiencePage() {
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('realtime');
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [pinnedState, setPinnedState] = useState<StateData | null>(null);
  const [viewTab, setViewTab] = useState<'map' | 'regions'>('map');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute dynamic state data according to selected app and time window
  const statesData: StateData[] = useMemo(() => {
    const currentApp = APPS_LIST.find((a) => a.id === selectedApp);
    const focusUF = currentApp?.stateFocus;

    // Multiplier based on period
    const periodMult = selectedPeriod === '30d' ? 4.8 : selectedPeriod === '7d' ? 2.5 : selectedPeriod === '24h' ? 1.4 : 1.0;

    let computedList = BASE_STATES.map((s) => {
      let rawUsers: number;
      if (focusUF) {
        if (s.uf === focusUF) {
          rawUsers = Math.round((currentApp?.totalActive || 15000) * 0.72 * periodMult);
        } else if (s.region === 'Sudeste' || s.region === 'Nordeste') {
          rawUsers = Math.round((currentApp?.totalActive || 15000) * 0.03 * periodMult);
        } else {
          rawUsers = Math.round((currentApp?.totalActive || 15000) * 0.008 * periodMult);
        }
      } else if (selectedApp === 'brasileirao') {
        const nationalWeights: Record<string, number> = {
          SP: 0.28, RJ: 0.18, MG: 0.12, RS: 0.09, BA: 0.07, PR: 0.05,
          CE: 0.04, PE: 0.035, SC: 0.03, GO: 0.025, DF: 0.02, PA: 0.015,
        };
        const weight = nationalWeights[s.uf] || 0.005;
        rawUsers = Math.round(68400 * weight * periodMult);
      } else {
        // 'all' apps
        const globalWeights: Record<string, number> = {
          SP: 0.26, RJ: 0.17, MG: 0.11, RS: 0.08, PE: 0.06, BA: 0.055,
          PR: 0.045, CE: 0.04, SC: 0.035, GO: 0.03, DF: 0.025, PA: 0.02,
        };
        const weight = globalWeights[s.uf] || 0.006;
        rawUsers = Math.round(142580 * weight * periodMult);
      }

      return {
        ...s,
        users: Math.max(10, rawUsers),
      };
    });

    const totalUsers = computedList.reduce((acc, curr) => acc + curr.users, 0);

    return computedList.map((s) => {
      const pct = (s.users / totalUsers) * 100;
      let level: StateData['heatLevel'] = 'minimal';
      if (pct >= 18) level = 'critical';
      else if (pct >= 9) level = 'high';
      else if (pct >= 4) level = 'medium';
      else if (pct >= 1.5) level = 'low';

      return {
        ...s,
        percentage: Number(pct.toFixed(1)),
        heatLevel: level,
      };
    });
  }, [selectedApp, selectedPeriod]);

  const totalEcossistemaUsers = useMemo(() => {
    return statesData.reduce((acc, curr) => acc + curr.users, 0);
  }, [statesData]);

  const topStates = useMemo(() => {
    return [...statesData].sort((a, b) => b.users - a.users).slice(0, 7);
  }, [statesData]);

  const activeInspection = pinnedState || hoveredState || topStates[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getHeatColor = (level: StateData['heatLevel'], isHovered: boolean) => {
    if (isHovered) return '#ffffff';
    switch (level) {
      case 'critical':
        return '#ef4444'; // Red (hot peak)
      case 'high':
        return '#f97316'; // Orange
      case 'medium':
        return '#eab308'; // Amber
      case 'low':
        return '#10b981'; // Emerald
      default:
        return '#1e293b'; // Slate dark
    }
  };

  const getHeatGlow = (level: StateData['heatLevel']) => {
    switch (level) {
      case 'critical':
        return 'rgba(239, 68, 68, 0.45)';
      case 'high':
        return 'rgba(249, 115, 22, 0.35)';
      case 'medium':
        return 'rgba(234, 179, 8, 0.25)';
      case 'low':
        return 'rgba(16, 185, 129, 0.2)';
      default:
        return 'none';
    }
  };

  return (
    <div className="space-y-8 pb-16" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Top Banner & Titulo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-live text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              • Telemetria ao Vivo
            </span>
            <span className="badge badge-ft text-[10px] font-bold px-2.5 py-0.5">
              GeoIP Ingestor & Sentinel
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck size={12} />
              LGPD Safe (Zero IP Persist)
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <MapPin className="text-amber-400 shrink-0" size={34} />
            Mapa de <span style={{ color: 'var(--primary)' }}>Calor & Audiência</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 max-w-2xl">
            Densidade geográfica em tempo real, fluxo de torcedores nos 27 estados e funil de permanência por tela.
          </p>
        </div>

        {/* Controles de Filtro & Recarregamento */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Seletor de App */}
          <div className="relative">
            <select
              value={selectedApp}
              onChange={(e) => {
                setSelectedApp(e.target.value);
                setPinnedState(null);
              }}
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border)',
                color: '#ffffff',
              }}
              aria-label="Selecionar Aplicativo"
              className="px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer pr-8"
            >
              {APPS_LIST.map((app) => (
                <option key={app.id} value={app.id} className="bg-slate-900 text-white">
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Período */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border)',
                color: '#ffffff',
              }}
              aria-label="Selecionar Período de Análise"
              className="px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer pr-8"
            >
              <option value="realtime" className="bg-slate-900 text-white">Hoje (Tempo Real)</option>
              <option value="24h" className="bg-slate-900 text-white">Últimas 24 Horas</option>
              <option value="7d" className="bg-slate-900 text-white">Últimos 7 Dias</option>
              <option value="30d" className="bg-slate-900 text-white">Últimos 30 Dias</option>
            </select>
          </div>

          {/* Botão Atualizar */}
          <button
            onClick={handleRefresh}
            style={{
              background: 'var(--surface-hover)',
              borderColor: 'var(--border)',
            }}
            className="p-2.5 rounded-xl border text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all"
            title="Atualizar dados de telemetria"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Usuários Ativos Estimados
            </p>
            <p className="text-3xl font-black text-white font-mono mt-1">
              {totalEcossistemaUsers.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={13} />
              <span>Sessões georreferenciadas</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Users size={24} />
          </div>
        </div>

        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Estado Líder de Audiência
            </p>
            <p className="text-3xl font-black text-amber-400 font-mono mt-1">
              {topStates[0]?.uf || 'SP'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">
              {topStates[0]?.name} ({topStates[0]?.percentage}%)
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Flame size={24} />
          </div>
        </div>

        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tela com Maior Retenção
            </p>
            <p className="text-2xl font-black text-white mt-1">
              Ao Vivo
            </p>
            <p className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
              <Activity size={13} />
              <span>48,2% do tempo total no app</span>
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Tv size={24} />
          </div>
        </div>

        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Dispositivos Móveis
            </p>
            <p className="text-2xl font-black text-white font-mono mt-1">
              87% <span className="text-xs text-[var(--text-muted)] font-normal">Android</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">
              13% iOS • Google Play Safe
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Smartphone size={24} />
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Painel do Mapa Interativo (Col 7 de 12) */}
        <div className="lg:col-span-7 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe size={18} className="text-amber-400" />
                Mapa Coroplético do Brasil (26 Estados + DF)
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Passe o mouse ou toque sobre um estado para auditar telemetria e cidades.
              </p>
            </div>

            {/* Alternador de Visualização */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-[var(--border)] text-xs font-bold">
              <button
                onClick={() => setViewTab('map')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewTab === 'map' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                Mapa Gráfico
              </button>
              <button
                onClick={() => setViewTab('regions')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewTab === 'regions' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                Por Regiões
              </button>
            </div>
          </div>

          {viewTab === 'map' ? (
            <div className="relative flex flex-col items-center">
              {/* SVG Map Container */}
              <div className="w-full max-w-[560px] aspect-square relative select-none">
                <svg
                  viewBox="0 0 600 680"
                  className="w-full h-full filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
                >
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Render 27 State Polygons */}
                  {statesData.map((st) => {
                    const isHovered = hoveredState?.uf === st.uf;
                    const isPinned = pinnedState?.uf === st.uf;
                    const fillColor = getHeatColor(st.heatLevel, isHovered || isPinned);
                    const glowShadow = getHeatGlow(st.heatLevel);

                    return (
                      <g
                        key={st.uf}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredState(st)}
                        onMouseLeave={() => setHoveredState(null)}
                        onClick={() => setPinnedState(pinnedState?.uf === st.uf ? null : st)}
                      >
                        <path
                          d={st.svgPath}
                          fill={fillColor}
                          stroke={isHovered || isPinned ? '#ffffff' : 'rgba(255,255,255,0.22)'}
                          strokeWidth={isHovered || isPinned ? 2.5 : 1.2}
                          style={{
                            transition: 'all 0.25s ease-in-out',
                            filter: isHovered || isPinned ? 'drop-shadow(0 0 8px rgba(255,255,255,0.7))' : `drop-shadow(0 0 4px ${glowShadow})`,
                          }}
                        />
                        {/* State UF Label */}
                        <text
                          x={st.labelX}
                          y={st.labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize={st.uf === 'DF' || st.uf === 'SE' || st.uf === 'AL' ? '9' : '11'}
                          fontWeight="800"
                          pointerEvents="none"
                          className="select-none font-mono tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        >
                          {st.uf}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legenda de Calor */}
              <div className="w-full pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  Gradiente Térmico de Densidade:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm shadow-red-500/50" />
                    <span className="text-white text-[11px] font-bold">Pico (&gt;18%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#f97316]" />
                    <span className="text-white text-[11px] font-bold">Alto (9-18%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#eab308]" />
                    <span className="text-white text-[11px] font-bold">Médio (4-9%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                    <span className="text-white text-[11px] font-bold">Baixo (1-4%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#1e293b] border border-slate-700" />
                    <span className="text-[var(--text-muted)] text-[11px]">Resíduo</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Visualização em Lista por Região */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['Sudeste', 'Nordeste', 'Sul', 'Centro-Oeste', 'Norte'] as const).map((reg) => {
                const regStates = statesData.filter((s) => s.region === reg);
                const regUsers = regStates.reduce((acc, curr) => acc + curr.users, 0);
                const regPct = ((regUsers / totalEcossistemaUsers) * 100).toFixed(1);

                return (
                  <div
                    key={reg}
                    className="p-4 rounded-xl bg-slate-900/60 border border-[var(--border)] hover:border-amber-400/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">{reg}</span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                        {regPct}%
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {regUsers.toLocaleString('pt-BR')} torcedores ativos
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {regStates.map((st) => (
                        <button
                          key={st.uf}
                          onClick={() => setPinnedState(st)}
                          className={`text-[10px] font-mono px-2 py-1 rounded font-bold transition-all border ${
                            activeInspection.uf === st.uf
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          {st.uf} ({st.percentage}%)
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel Lateral de Detalhes & Ranking (Col 5 de 12) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Detalhes do Estado Selecionado */}
          <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-white font-mono">{activeInspection.uf}</span>
                  <span className="badge badge-ft text-[10px] font-bold px-2 py-0.5">
                    {activeInspection.region}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-200 mt-1">
                  {activeInspection.name}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {activeInspection.users.toLocaleString('pt-BR')}
                </span>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  {activeInspection.percentage}% da audiência
                </p>
              </div>
            </div>

            {/* Barra de Intensidade Térmica */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[var(--text-muted)]">Densidade de Tráfego</span>
                <span className="text-white font-mono">{activeInspection.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, activeInspection.percentage * 3.5)}%`,
                    backgroundColor: getHeatColor(activeInspection.heatLevel, false),
                  }}
                />
              </div>
            </div>

            {/* Cidades Mais Ativas */}
            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Building size={14} className="text-amber-400" />
                Cidades Mais Conectadas
              </h4>
              <div className="space-y-2">
                {activeInspection.topCities.map((city, idx) => (
                  <div
                    key={city.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-[var(--border)] text-xs"
                  >
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {city.name}
                    </span>
                    <span className="font-mono text-slate-300 font-bold">
                      {city.users.toLocaleString('pt-BR')} usuários
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferência de Clube & Time do Coração */}
            <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-semibold">Maior Torcida Ativa:</span>
              <span className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                {activeInspection.favTeam}
              </span>
            </div>
          </div>

          {/* Ranking Top 5 Estados */}
          <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Flame size={16} className="text-red-400" />
              Ranking de Estados Mais Ativos
            </h3>

            <div className="space-y-2.5">
              {topStates.slice(0, 5).map((st, idx) => (
                <div
                  key={st.uf}
                  onClick={() => setPinnedState(st)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    activeInspection.uf === st.uf
                      ? 'bg-[var(--surface-hover)] border-[var(--primary)]'
                      : 'bg-slate-900/40 border-[var(--border)] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono text-xs font-black flex items-center justify-center ${
                        idx === 0
                          ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {st.name} <span className="text-[var(--text-muted)] font-mono">({st.uf})</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {st.users.toLocaleString('pt-BR')} usuários ativos
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-amber-400">
                    {st.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Engajamento por Tela & Oportunidades Comerciais */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Funil de Telas Navegadas (Col 6 de 12) */}
        <div className="lg:col-span-6 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone size={18} className="text-blue-400" />
                Funil de Engajamento por Módulo / Tela
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Onde os torcedores passam a maior parte do tempo de sessão.
              </p>
            </div>
            <span className="badge badge-ft text-[10px] font-bold px-2 py-0.5">
              TELEMETRIA
            </span>
          </div>

          <div className="space-y-4">
            {/* Ao Vivo */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-2">
                  <Tv size={14} className="text-emerald-400" />
                  Jogos Ao Vivo (Lance a Lance & Eventos)
                </span>
                <span className="text-emerald-400 font-mono">48,2%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: '48.2%' }} />
              </div>
            </div>

            {/* Tabela de Classificação */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-2">
                  <Table size={14} className="text-blue-400" />
                  Tabela / Classificação & Chaveamento
                </span>
                <span className="text-blue-400 font-mono">26,5%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-blue-400" style={{ width: '26.5%' }} />
              </div>
            </div>

            {/* Pílulas de Notícias */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-2">
                  <Newspaper size={14} className="text-amber-400" />
                  Pílulas de Notícias & Matérias
                </span>
                <span className="text-amber-400 font-mono">12,1%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: '12.1%' }} />
              </div>
            </div>

            {/* Vídeos */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-2">
                  <Video size={14} className="text-purple-400" />
                  Vídeos do YouTube & Melhores Momentos
                </span>
                <span className="text-purple-400 font-mono">7,4%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-purple-400" style={{ width: '7.4%' }} />
              </div>
            </div>

            {/* IA e Palpites */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-rose-400" />
                  Análise de IA & Probabilidades Pré-Jogo
                </span>
                <span className="text-rose-400 font-mono">5,8%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-rose-400" style={{ width: '5.8%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Oportunidades Comerciais House Ads (Col 6 de 12) */}
        <div className="lg:col-span-6 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone size={18} className="text-amber-400" />
                Oportunidades Comerciais (House Ads Cross-Selling)
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Regiões com alto calor de acessos e espaços patrocinados disponíveis.
              </p>
            </div>
            <Link
              href="/adminpanel/ads/new"
              className="px-3 py-1.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1.5"
            >
              Criar Campanha
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-[var(--border)] space-y-2 hover:border-amber-400/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Alta Densidade no Rio de Janeiro (RJ)
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                  22.800 ativos
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                O Topo da Tabela no app Carioca tem alto CTR durante as rodadas de clássicos. Espaço livre para anúncio regional.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-[var(--border)] space-y-2 hover:border-amber-400/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Expansão de Audiência em Pernambuco (PE)
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">
                  7.400 ativos
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Recife e Caruaru com grande número de torcedores simultâneos. Ideal para anunciantes regionais de apostas ou varejo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-[var(--border)] space-y-2 hover:border-amber-400/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Campanha Nacional no Brasileirão
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded">
                  Cobertura 27 UFs
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Audiência uniformemente distribuída entre SP, RJ, MG, RS e BA. Banner fixo no Topo de Jogos com mais de 68.000 impressões/dia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

