"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Bot,
  Send,
  Loader2,
  Clock,
  Radio,
  Sliders,
  SlidersHorizontal,
  Save,
  Check,
  Settings2,
  Info,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";
const PB_COMMENTS_URL = "https://zapscore-pocketbase-comentarios.gtalg3.easypanel.host";
const CRAWL4AI_URL = "https://zapscore-crwal4ai.gtalg3.easypanel.host";

interface TeamInfo {
  name: string;
  logo?: string;
}

interface FixtureCardData {
  externalId: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeGoals: number | null;
  awayGoals: number | null;
  statusShort: string | null;
  elapsed: number | null;
  date: string;
  round?: string | null;
}

interface CommentItem {
  id: string;
  fixture_id: number;
  league_id: number;
  minute: number;
  phase: string;
  title: string;
  comment: string;
  sentiment: string;
  created: string;
}

interface TacticalPromptConfigState {
  coach_vs_fan: number;
  casualness: number;
  live_length: 'FLASH' | 'SHORT' | 'NORMAL';
  pause_length: 'SUMMARY' | 'DEEP';
  focus_highlights: boolean;
  focus_table_impact: boolean;
  focus_substitutions: boolean;
  enable_crawl4ai: boolean;
  crawl_sources: string;
  custom_rules: string;
}

interface CompetitionTab {
  id: number;
  name: string;
  shortName: string;
  flag: string;
}

interface RegionModule {
  id: string;
  name: string;
  competitions: CompetitionTab[];
}

const REGION_MODULES: RegionModule[] = [
  {
    id: 'brasil',
    name: 'Brasil',
    competitions: [
      { id: 71, name: 'Brasileirão Série A', shortName: 'Série A', flag: '🇧🇷' },
      { id: 72, name: 'Brasileirão Série B', shortName: 'Série B', flag: '🇧🇷' },
      { id: 73, name: 'Copa do Brasil', shortName: 'Copa do Brasil', flag: '🏆' },
    ],
  },
  {
    id: 'europa',
    name: 'Europa',
    competitions: [
      { id: 2, name: 'Champions League', shortName: 'Champions', flag: '⭐' },
      { id: 39, name: 'Premier League', shortName: 'Premier', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { id: 140, name: 'La Liga', shortName: 'La Liga', flag: '🇪🇸' },
      { id: 78, name: 'Bundesliga', shortName: 'Bundesliga', flag: '🇩🇪' },
      { id: 135, name: 'Serie A Itália', shortName: 'Serie A ITA', flag: '🇮🇹' },
      { id: 61, name: 'Ligue 1', shortName: 'Ligue 1', flag: '🇫🇷' },
    ],
  },
  {
    id: 'copas',
    name: 'Copas',
    competitions: [
      { id: 13, name: 'Copa Libertadores', shortName: 'Libertadores', flag: '🏆' },
      { id: 612, name: 'Copa do Nordeste', shortName: 'Nordestão', flag: '☀️' },
    ],
  },
  {
    id: 'estaduais',
    name: 'Estaduais',
    competitions: [
      { id: 475, name: 'Paulista A1', shortName: 'Paulistão', flag: '🏙️' },
      { id: 624, name: 'Carioca Série A', shortName: 'Carioca', flag: '🌊' },
      { id: 477, name: 'Gaúcho Série A', shortName: 'Gauchão', flag: '🧉' },
      { id: 629, name: 'Mineiro Módulo 1', shortName: 'Mineiro', flag: '🔺' },
    ],
  },
];

export default function TacticalCommentsAgentPage() {
  // Infraestrutura & Saúde
  const [pbStatus, setPbStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [crawlStatus, setCrawlStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [crawlStats, setCrawlStats] = useState<{ memory?: number; cpu?: number } | null>(null);

  // Navegação de Módulos e Competições
  const [selectedRegion, setSelectedRegion] = useState<string>('brasil');
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(71);

  // Lista de Partidas do Dia / Competição
  const [fixtures, setFixtures] = useState<FixtureCardData[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState<boolean>(true);
  const [selectedFixture, setSelectedFixture] = useState<FixtureCardData | null>(null);

  // Modo Operacional: 'manual' | 'automatico' | 'configuracoes'
  const [operationTab, setOperationTab] = useState<'manual' | 'automatico' | 'configuracoes'>('manual');

  // Calibração do Prompt
  const [promptConfig, setPromptConfig] = useState<TacticalPromptConfigState>({
    coach_vs_fan: 50,
    casualness: 60,
    live_length: 'SHORT',
    pause_length: 'DEEP',
    focus_highlights: true,
    focus_table_impact: true,
    focus_substitutions: true,
    enable_crawl4ai: true,
    crawl_sources: 'ge.globo.com,lance.com.br,uol.com.br',
    custom_rules: 'Obedecer rigorosamente ao idioma sem estrangeirismos em inglês. Usar expressões naturais do futebol brasileiro.',
  });
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<string | null>(null);

  // Feed de Comentários da Partida Selecionada
  const [fixtureComments, setFixtureComments] = useState<CommentItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);
  const [autoRefreshFeed, setAutoRefreshFeed] = useState<boolean>(true);

  // Formulário da Aba Manual
  const [targetPhase, setTargetPhase] = useState<string>('PRE_MATCH');
  const [targetMinute, setTargetMinute] = useState<string>('0');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [adminApiKey] = useState<string>('7Ma+1d8R2VkkAEUzGNLhrVYaoYfOLaUdxXTkocQa+ac=');
  const [generating, setGenerating] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string; data?: any } | null>(null);

  // Carrega configuração de calibração do prompt do PocketBase
  const loadPromptConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch(`${API_URL}/fixtures/comments/config`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setPromptConfig({
            coach_vs_fan: data.coach_vs_fan ?? 50,
            casualness: data.casualness ?? 60,
            live_length: data.live_length || 'SHORT',
            pause_length: data.pause_length || 'DEEP',
            focus_highlights: data.focus_highlights !== undefined ? data.focus_highlights : true,
            focus_table_impact: data.focus_table_impact !== undefined ? data.focus_table_impact : true,
            focus_substitutions: data.focus_substitutions !== undefined ? data.focus_substitutions : true,
            enable_crawl4ai: data.enable_crawl4ai !== undefined ? data.enable_crawl4ai : true,
            crawl_sources: data.crawl_sources || 'ge.globo.com,lance.com.br,uol.com.br',
            custom_rules: data.custom_rules ?? '',
          });
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar prompt config:', err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Salva calibração no PocketBase
  const handleSavePromptConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSavingConfig(true);
      setConfigSaveSuccess(null);
      const res = await fetch(`${API_URL}/fixtures/comments/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': adminApiKey.trim(),
        },
        body: JSON.stringify(promptConfig),
      });

      if (res.ok) {
        setConfigSaveSuccess('Calibração salva com sucesso no PocketBase! As próximas análises da IA já seguirão estas diretrizes.');
        setTimeout(() => setConfigSaveSuccess(null), 5000);
      } else {
        alert('Erro ao salvar configuração.');
      }
    } catch (err: any) {
      alert(`Falha ao salvar configuração: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  // Verifica a saúde dos serviços
  const checkHealthServices = async () => {
    try {
      const pbRes = await fetch(`${PB_COMMENTS_URL}/api/health`, { cache: 'no-store' });
      setPbStatus(pbRes.ok ? 'healthy' : 'offline');
    } catch {
      setPbStatus('offline');
    }

    try {
      const crawlRes = await fetch(`${CRAWL4AI_URL}/health`, { cache: 'no-store' });
      if (crawlRes.ok) {
        const data = await crawlRes.json();
        setCrawlStatus('healthy');
        setCrawlStats({ memory: data.memory_usage, cpu: data.cpu_usage });
      } else {
        setCrawlStatus('offline');
      }
    } catch {
      setCrawlStatus('offline');
    }
  };

  // Carrega as partidas do dia para a liga selecionada
  const loadFixturesForLeague = useCallback(async (leagueId: number) => {
    setLoadingFixtures(true);
    try {
      // 1. Tenta carregar as partidas do dia na liga
      const todayRes = await fetch(`${API_URL}/fixtures/today?leagueId=${leagueId}`, { cache: 'no-store' });
      let list: any[] = [];

      if (todayRes.ok) {
        const todayData = await todayRes.json();
        list = Array.isArray(todayData) ? todayData : todayData.data || [];
      }

      // 2. Se hoje não tiver jogos marcados, busca as partidas recentes/próximas da competição
      if (list.length === 0) {
        const fallbackRes = await fetch(`${API_URL}/fixtures?leagueId=${leagueId}&limit=12`, { cache: 'no-store' });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          list = Array.isArray(fbData) ? fbData : fbData.data || [];
        }
      }

      const formatted: FixtureCardData[] = list.map((f: any) => ({
        externalId: f.externalId,
        homeTeam: { name: f.homeTeam?.name || 'Mandante', logo: f.homeTeam?.logo },
        awayTeam: { name: f.awayTeam?.name || 'Visitante', logo: f.awayTeam?.logo },
        homeGoals: f.homeGoals,
        awayGoals: f.awayGoals,
        statusShort: f.statusShort,
        elapsed: f.elapsed,
        date: f.date,
        round: f.round,
      }));

      setFixtures(formatted);

      // Se não tiver partida selecionada ou a selecionada não estiver na lista, seleciona a primeira
      if (formatted.length > 0) {
        setSelectedFixture((prev) => {
          if (!prev || !formatted.some((m) => m.externalId === prev.externalId)) {
            return formatted[0];
          }
          return prev;
        });
      } else {
        setSelectedFixture(null);
      }
    } catch (e) {
      console.error('Falha ao carregar partidas da competição', e);
      setFixtures([]);
      setSelectedFixture(null);
    } finally {
      setLoadingFixtures(false);
    }
  }, []);

  // Carrega o feed de comentários da partida selecionada
  const loadCommentsForSelectedFixture = useCallback(async (fixtureId: number) => {
    setLoadingFeed(true);
    try {
      const res = await fetch(
        `${PB_COMMENTS_URL}/api/collections/fixture_comments/records?filter=(fixture_id=${fixtureId})&sort=minute,id`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setFixtureComments(data.items || []);
      }
    } catch (e) {
      console.error('Erro ao buscar comentários da partida no PocketBase', e);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  // Efeito inicial: healthcheck e primeira carga
  useEffect(() => {
    checkHealthServices();
    loadPromptConfig();
  }, [loadPromptConfig]);

  // Efeito ao trocar liga selecionada
  useEffect(() => {
    loadFixturesForLeague(selectedLeagueId);
  }, [selectedLeagueId, loadFixturesForLeague]);

  // Efeito ao trocar partida selecionada: busca os comentários dela
  useEffect(() => {
    if (selectedFixture) {
      loadCommentsForSelectedFixture(selectedFixture.externalId);
      // Ajusta minuto e fase recomendada
      if (selectedFixture.statusShort === '1H') {
        setTargetPhase('FIRST_HALF');
        setTargetMinute(String(selectedFixture.elapsed || 25));
      } else if (selectedFixture.statusShort === 'HT') {
        setTargetPhase('HALF_TIME');
        setTargetMinute('45');
      } else if (selectedFixture.statusShort === '2H') {
        setTargetPhase('SECOND_HALF');
        setTargetMinute(String(selectedFixture.elapsed || 70));
      } else if (['FT', 'AET', 'PEN'].includes(selectedFixture.statusShort || '')) {
        setTargetPhase('FULL_TIME');
        setTargetMinute('90');
      } else {
        setTargetPhase('PRE_MATCH');
        setTargetMinute('0');
      }
    } else {
      setFixtureComments([]);
    }
  }, [selectedFixture, loadCommentsForSelectedFixture]);

  // Polling automático para a aba Automático (se ativado)
  useEffect(() => {
    if (!autoRefreshFeed || operationTab !== 'automatico' || !selectedFixture) return;
    const interval = setInterval(() => {
      loadCommentsForSelectedFixture(selectedFixture.externalId);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefreshFeed, operationTab, selectedFixture, loadCommentsForSelectedFixture]);

  // Handler de Geração Manual
  const handleGenerateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) {
      setActionResult({ type: 'error', message: 'Por favor, selecione uma partida acima.' });
      return;
    }

    setGenerating(true);
    setActionResult(null);

    try {
      const payload: any = {
        phase: targetPhase,
      };
      if (targetMinute) payload.minute = parseInt(targetMinute, 10);
      if (externalUrl.trim()) payload.externalContextUrl = externalUrl.trim();

      const res = await fetch(`${API_URL}/fixtures/${selectedFixture.externalId}/comments/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': adminApiKey.trim(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setActionResult({
          type: 'success',
          message: `Comentário [${targetPhase}] gerado e gravado no PocketBase com sucesso!`,
          data: data.data,
        });
        // Atualiza a timeline da partida
        setTimeout(() => {
          loadCommentsForSelectedFixture(selectedFixture.externalId);
        }, 600);
      } else {
        setActionResult({
          type: 'error',
          message: data.message || `Erro ${res.status}: Não foi possível gerar o comentário.`,
        });
      }
    } catch (err: any) {
      setActionResult({
        type: 'error',
        message: `Falha na requisição: ${err.message}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  const currentRegion = REGION_MODULES.find((r) => r.id === selectedRegion) || REGION_MODULES[0];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/adminpanel" className="hover:text-white transition-colors">AdminPanel</Link>
          <span>/</span>
          <Link href="/adminpanel/agents" className="hover:text-white transition-colors">Central de Agentes</Link>
          <span>/</span>
          <span className="text-violet-400 font-medium">Comentários Táticos ao Vivo</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Agente de Comentários Táticos ao Vivo
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-semibold tracking-wide">
                  IA MULTI-FONTES
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Geração cronológica de comentários para a aba de Detalhes da Partida via Gemini 1.5 & PocketBase dedicado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                checkHealthServices();
                if (selectedFixture) loadCommentsForSelectedFixture(selectedFixture.externalId);
                loadFixturesForLeague(selectedLeagueId);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw size={13} className={loadingFixtures || loadingFeed ? 'animate-spin text-violet-400' : ''} />
              Atualizar
            </button>
            <Link
              href="/adminpanel/agents"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={13} />
              Voltar
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Status Bar Compacto dos Serviços */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Database size={15} className="text-violet-400" />
              <span className="text-slate-300 font-medium">PocketBase Comentários</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              pbStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pbStatus === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {pbStatus === 'healthy' ? 'Conectado' : 'Offline'}
            </span>
          </div>

          <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Cpu size={15} className="text-cyan-400" />
              <span className="text-slate-300 font-medium">Crawl4AI Microservice</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              crawlStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${crawlStatus === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {crawlStatus === 'healthy' ? `Online (${crawlStats?.memory ? `${crawlStats.memory}%` : '65%'})` : 'Offline'}
            </span>
          </div>

          <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Bot size={15} className="text-orange-400" />
              <span className="text-slate-300 font-medium">Motor LLM</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
              Gemini 1.5 Flash
            </span>
          </div>
        </div>

        {/* 1. SELEÇÃO DE REGIÕES & COMPETIÇÕES */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          {/* Abas de Regiões Principais (Brasil, Europa, Copas, Estaduais) */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5 shrink-0">
              <Layers size={14} className="text-violet-400" />
              Módulos:
            </span>
            {REGION_MODULES.map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  setSelectedRegion(reg.id);
                  if (reg.competitions.length > 0) {
                    setSelectedLeagueId(reg.competitions[0].id);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {reg.name}
              </button>
            ))}
          </div>

          {/* Sub-Abas das Competições da Região Ativa */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto">
            <span className="text-[11px] font-medium text-slate-400 mr-2 shrink-0">
              Competições em {currentRegion.name}:
            </span>
            {currentRegion.competitions.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedLeagueId(comp.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedLeagueId === comp.id
                    ? 'bg-slate-800 text-violet-300 border border-violet-500/30'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                <span>{comp.flag}</span>
                <span>{comp.name}</span>
                <span className="text-[10px] opacity-60 font-mono">({comp.id})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. GRADE VISUAL DE PARTIDAS DO DIA */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-violet-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Partidas Disponíveis • Clique na partida para compor ou monitorar
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              {fixtures.length} partida(s) encontrada(s)
            </span>
          </div>

          {loadingFixtures ? (
            <div className="py-8 flex items-center justify-center text-slate-500 gap-2">
              <Loader2 size={18} className="animate-spin text-violet-400" />
              <span className="text-xs">Buscando grade de partidas...</span>
            </div>
          ) : fixtures.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              Nenhuma partida encontrada nesta competição no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {fixtures.map((match) => {
                const isSelected = selectedFixture?.externalId === match.externalId;
                const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.statusShort || '');
                const isFinished = ['FT', 'AET', 'PEN'].includes(match.statusShort || '');

                return (
                  <div
                    key={match.externalId}
                    onClick={() => setSelectedFixture(match)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none relative ${
                      isSelected
                        ? 'bg-violet-950/30 border-violet-500 shadow-md shadow-violet-600/20 ring-1 ring-violet-500'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Header do card: status e horário */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                        isLive
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : isFinished
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isLive ? `AO VIVO • ${match.elapsed}'` : isFinished ? 'ENCERRADO' : 'AGENDADO'}
                      </span>
                      <span className="font-mono">
                        {new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Confronto */}
                    <div className="space-y-1.5">
                      {/* Mandante */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {match.homeTeam.logo ? (
                            <img
                              src={match.homeTeam.logo}
                              alt={match.homeTeam.name}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center font-bold">
                              {match.homeTeam.name.slice(0, 1)}
                            </div>
                          )}
                          <span className={`text-xs truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}>
                            {match.homeTeam.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono ml-2">
                          {match.homeGoals !== null ? match.homeGoals : '-'}
                        </span>
                      </div>

                      {/* Visitante */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {match.awayTeam.logo ? (
                            <img
                              src={match.awayTeam.logo}
                              alt={match.awayTeam.name}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center font-bold">
                              {match.awayTeam.name.slice(0, 1)}
                            </div>
                          )}
                          <span className={`text-xs truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}>
                            {match.awayTeam.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono ml-2">
                          {match.awayGoals !== null ? match.awayGoals : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Footer com ID */}
                    <div className="mt-2.5 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>ID: {match.externalId}</span>
                      {isSelected && (
                        <span className="text-violet-400 font-semibold flex items-center gap-0.5">
                          Ativa <CheckCircle2 size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. PAINEL DE OPERAÇÃO: DUAS ABAS (MANUAL vs AUTOMÁTICO) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          {/* Header com a partida selecionada e as duas abas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Partida Selecionada:
              </div>
              {selectedFixture ? (
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="text-violet-400">{selectedFixture.homeTeam.name}</span>
                  <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs">
                    {selectedFixture.homeGoals ?? 0} x {selectedFixture.awayGoals ?? 0}
                  </span>
                  <span className="text-violet-400">{selectedFixture.awayTeam.name}</span>
                  <span className="text-xs text-slate-500 font-mono font-normal">
                    (ID: {selectedFixture.externalId})
                  </span>
                </div>
              ) : (
                <div className="text-xs text-amber-400 italic">
                  Nenhuma partida selecionada. Escolha uma partida acima para continuar.
                </div>
              )}
            </div>

            {/* Alternador de Abas: Manual vs Automático */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
              <button
                onClick={() => setOperationTab('manual')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  operationTab === 'manual'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders size={14} />
                Aba Manual (Compor)
              </button>
              <button
                onClick={() => setOperationTab('automatico')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  operationTab === 'automatico'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio size={14} className={operationTab === 'automatico' ? 'animate-pulse text-violet-200' : ''} />
                Aba Automático (Feed ao Vivo)
              </button>
              <button
                onClick={() => setOperationTab('configuracoes')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  operationTab === 'configuracoes'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal size={14} />
                Configurações do Prompt
              </button>
            </div>
          </div>

          {/* CONTEÚDO DA ABA MANUAL: FORMULÁRIO DE COMPOSIÇÃO */}
          {operationTab === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <form onSubmit={handleGenerateComment} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Fase Cronológica
                      </label>
                      <select
                        value={targetPhase}
                        onChange={(e) => setTargetPhase(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all cursor-pointer"
                      >
                        <option value="PRE_MATCH">Pré-Jogo (Expectativa & Desfalques)</option>
                        <option value="FIRST_HALF">1º Tempo (Dinâmica Inicial)</option>
                        <option value="HALF_TIME">Intervalo (Ajustes Táticos)</option>
                        <option value="SECOND_HALF">2º Tempo (Substituições & Pressão)</option>
                        <option value="FULL_TIME">Fim de Jogo (Balanço Final)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1.5">
                        Minuto do Lance / Comentário
                      </label>
                      <input
                        type="number"
                        value={targetMinute}
                        onChange={(e) => setTargetMinute(e.target.value)}
                        placeholder="Ex: 35"
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all placeholder:text-slate-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      URL de Apoio para o Crawl4AI (Opcional)
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://ge.globo.com/... ou link de transmissão externa"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all placeholder:text-slate-600"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      O Crawl4AI extrairá o markdown limpo desta URL para fornecer contexto rico ao Gemini. Se vazio, o agente usará as estatísticas nativas do jogo.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={generating || !selectedFixture}
                      className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
                    >
                      {generating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processando IA & Salvando no PocketBase...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Gerar Comentário Tático & Persistir no PocketBase
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Feedback de Ação */}
                {actionResult && (
                  <div className={`p-4 rounded-xl border text-xs ${
                    actionResult.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      {actionResult.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {actionResult.message}
                    </div>
                    {actionResult.data && (
                      <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 space-y-1">
                        <div><strong>Título:</strong> {actionResult.data.title}</div>
                        <div><strong>Sentimento:</strong> {actionResult.data.sentiment}</div>
                        <div><strong>ID PocketBase:</strong> <span className="font-mono">{actionResult.data.id}</span></div>
                        <div className="text-[11px] text-emerald-200/90 italic mt-1">&ldquo;{actionResult.data.comment}&rdquo;</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coluna Direita da Aba Manual: Preview e Dicas */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Eye size={15} className="text-violet-400" />
                  Diretrizes de Geração por Fase
                </div>
                <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-200">Pré-Jogo (0&apos;):</strong> O agente analisa escalações confirmadas, desfalques e proposta esperada de cada técnico.</p>
                  <p><strong className="text-slate-200">1º Tempo & 2º Tempo:</strong> Destaca a postura em campo, mapa de calor, finalizações perigosas e encaixe de marcação.</p>
                  <p><strong className="text-slate-200">Intervalo (45&apos;):</strong> Balanço dos primeiros 45 minutos e correções que os técnicos devem fazer.</p>
                  <p><strong className="text-slate-200">Fim de Jogo (90&apos;):</strong> Resumo completo da partida, justiça no resultado e impacto na tabela.</p>
                </div>

                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-[11px] text-violet-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Persistência Automática
                  </div>
                  <p>
                    Assim que gerado, o comentário é persistido na collection <code className="font-mono text-white">fixture_comments</code> e fica disponível publicamente para exibição na aba de detalhes do app móvel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA AUTOMÁTICO: FEED AO VIVO CRONOLÓGICO */}
          {operationTab === 'automatico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Radio size={16} className="text-violet-400" />
                    Feed Cronológico da Partida Selecionada
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Linha do tempo tática completa (Pré-Jogo ➔ Tempo Real ➔ Resumo Final).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRefreshFeed}
                      onChange={(e) => setAutoRefreshFeed(e.target.checked)}
                      className="rounded border-slate-700 text-violet-600 focus:ring-violet-500"
                    />
                    Auto-atualizar (10s)
                  </label>
                  <button
                    onClick={() => {
                      if (selectedFixture) loadCommentsForSelectedFixture(selectedFixture.externalId);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-all"
                    title="Recarregar feed"
                  >
                    <RefreshCw size={13} className={loadingFeed ? 'animate-spin text-violet-400' : ''} />
                  </button>
                </div>
              </div>

              {loadingFeed ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 size={22} className="animate-spin text-violet-400" />
                  <span className="text-xs">Sincronizando timeline da partida...</span>
                </div>
              ) : fixtureComments.length === 0 ? (
                <div className="py-12 px-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 space-y-2">
                  <MessageSquare size={32} className="mx-auto text-slate-600 stroke-[1.5]" />
                  <p className="text-xs text-slate-300 font-medium">Nenhum comentário gerado para esta partida ainda.</p>
                  <p className="text-[11px] text-slate-500">
                    Alterne para a <strong>Aba Manual</strong> para compor o comentário inicial de Pré-Jogo ou disparar um lance.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 pl-5 space-y-5 my-2">
                  {fixtureComments.map((comment) => (
                    <div key={comment.id} className="relative group">
                      {/* Ponto na linha do tempo */}
                      <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-violet-500 group-hover:bg-violet-500 transition-all" />

                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono">
                              {comment.phase} {comment.minute !== undefined ? `• ${comment.minute}'` : ''}
                            </span>
                            <h4 className="text-xs font-semibold text-white">
                              {comment.title}
                            </h4>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            comment.sentiment === 'DOMINANT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : comment.sentiment === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : comment.sentiment === 'SURPRISE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {comment.sentiment}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {comment.comment}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900 font-mono">
                          <span>Fixture: <strong className="text-slate-400">{comment.fixture_id}</strong></span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(comment.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA CONFIGURAÇÕES: CALIBRAÇÃO DO PROMPT DA IA */}
          {operationTab === 'configuracoes' && (
            <div className="space-y-6">
              {/* Header da Aba de Configuração */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-violet-400" />
                    Calibração Dinâmica do Prompt de Comentários Táticos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ajuste o tom, a visão (técnico vs torcedor), nível de resenha e tamanho dos comentários sem necessidade de novo deploy.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadPromptConfig}
                    disabled={loadingConfig}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={13} className={loadingConfig ? 'animate-spin text-violet-400' : ''} />
                    Recarregar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePromptConfig()}
                    disabled={savingConfig}
                    className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-violet-600/25"
                  >
                    {savingConfig ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Banner de Sucesso */}
              {configSaveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>{configSaveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSavePromptConfig} className="space-y-6">
                {/* 1. SLIDERS: TOM E PERSPECTIVA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Slider 1: Visão do Técnico vs Visão do Torcedor */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>👔 Visão do Técnico</span>
                        <span className="text-slate-500 text-[10px]">vs</span>
                        <span>🗣️ Visão do Torcedor</span>
                      </label>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {100 - promptConfig.coach_vs_fan}% / {promptConfig.coach_vs_fan}%
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={promptConfig.coach_vs_fan}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({
                            ...prev,
                            coach_vs_fan: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>👔 100% Prancheta Tática</span>
                        <span>50% Equilíbrio</span>
                        <span>🗣️ 100% Arquibancada</span>
                      </div>
                    </div>

                    {/* Badge Explicativo do Estado do Slider */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
                      <Info size={14} className="text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        {promptConfig.coach_vs_fan <= 25 && (
                          <span>
                            <strong>Foco Tático Rígido:</strong> Análise analítica fria, prancheta tática, compactação de linhas e transições posicionais.
                          </span>
                        )}
                        {promptConfig.coach_vs_fan > 25 && promptConfig.coach_vs_fan <= 70 && (
                          <span>
                            <strong>Equilíbrio Recomendado:</strong> Mescla perfeita entre leitura tática profunda e a vibração/calor do jogo.
                          </span>
                        )}
                        {promptConfig.coach_vs_fan > 70 && (
                          <span>
                            <strong>Foco Emocional de Bancada:</strong> Comentários mais apaixonados, valorizando a raça, pressão da torcida e sentimento do jogo.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slider 2: Grau de Casualidade / Resenha */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>💬 Grau de Casualidade / Resenha</span>
                      </label>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {promptConfig.casualness}%
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={promptConfig.casualness}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({
                            ...prev,
                            casualness: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>0% Sóbrio/Jornalístico</span>
                        <span>50% Dinâmico</span>
                        <span>100% Resenha Pura</span>
                      </div>
                    </div>

                    {/* Badge Explicativo da Casualidade */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
                      <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        {promptConfig.casualness <= 25 && (
                          <span>
                            <strong>Tom Formal & Sóbrio:</strong> Jornalismo clássico tradicional, vocabulário sóbrio sem gírias do futebol.
                          </span>
                        )}
                        {promptConfig.casualness > 25 && promptConfig.casualness <= 60 && (
                          <span>
                            <strong>Equilibrado & Dinâmico:</strong> Linguagem moderna de transmissão esportiva, fluida e direta.
                          </span>
                        )}
                        {promptConfig.casualness > 60 && promptConfig.casualness <= 85 && (
                          <span>
                            <strong>Casual & Resenha de Boleiro:</strong> Autêntico futebol brasileiro, leve e inteligente (sem estrangeirismos).
                          </span>
                        )}
                        {promptConfig.casualness > 85 && (
                          <span>
                            <strong>Ultra Casual & Arquibancada:</strong> Clima de pura resenha de torcedor e bate-papo de barbearia esportiva.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CONTROLE DE EXTENSÃO / TAMANHO POR FASE */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Clock size={15} className="text-violet-400" />
                    Controle de Extensão do Texto por Fase da Partida
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Durante o Jogo: 1º e 2º Tempo */}
                    <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-200">
                          ⏱️ Durante o Jogo (1º e 2º Tempo)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          Bola Rolando
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Define a concisão dos comentários durante os 90 minutos para não poluir a tela.
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[
                          { value: 'FLASH', label: 'Flash', sub: '~30 palavras', desc: '2 frases diretas' },
                          { value: 'SHORT', label: 'Curto (Metade)', sub: '~45 palavras', desc: '1 parágrafo enxuto', rec: true },
                          { value: 'NORMAL', label: 'Padrão', sub: '~80 palavras', desc: '1 a 2 parágrafos' },
                        ].map((opt) => {
                          const isSelected = promptConfig.live_length === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setPromptConfig((prev) => ({
                                  ...prev,
                                  live_length: opt.value as any,
                                }))
                              }
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                                isSelected
                                  ? 'bg-violet-600/15 border-violet-500 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              {opt.rec && (
                                <span className="absolute -top-1.5 -right-1 text-[8px] font-bold px-1.5 py-0.2 bg-violet-600 text-white rounded-full">
                                  Ideal
                                </span>
                              )}
                              <div className="text-xs font-semibold">{opt.label}</div>
                              <div className="text-[10px] font-mono text-violet-400">{opt.sub}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pausas e Conclusão: Pré-Jogo, Intervalo e Fim */}
                    <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-200">
                          🏁 Pré-Jogo, Intervalo & Fim de Jogo
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                          Pausas
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Define a profundidade da leitura antes do jogo, no intervalo e no apito final.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { value: 'SUMMARY', label: 'Síntese', sub: '~55 palavras', desc: '1 parágrafo direto' },
                          { value: 'DEEP', label: 'Completo / Denso', sub: '~100 palavras', desc: '1 a 2 parágrafos aprofundados', rec: true },
                        ].map((opt) => {
                          const isSelected = promptConfig.pause_length === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setPromptConfig((prev) => ({
                                  ...prev,
                                  pause_length: opt.value as any,
                                }))
                              }
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                                isSelected
                                  ? 'bg-violet-600/15 border-violet-500 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              {opt.rec && (
                                <span className="absolute -top-1.5 -right-1 text-[8px] font-bold px-1.5 py-0.2 bg-violet-600 text-white rounded-full">
                                  Ideal
                                </span>
                              )}
                              <div className="text-xs font-semibold">{opt.label}</div>
                              <div className="text-[10px] font-mono text-violet-400">{opt.sub}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. FOCOS ADICIONAIS & TOGGLES */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <Sparkles size={15} className="text-violet-400" />
                    Focos Temáticos Dinâmicos da IA
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      promptConfig.focus_highlights
                        ? 'bg-violet-500/10 border-violet-500/40 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={promptConfig.focus_highlights}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({ ...prev, focus_highlights: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">Destaques Individuais</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Citar os melhores e piores jogadores em campo, atuações decisivas e lances capitais.
                        </div>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      promptConfig.focus_table_impact
                        ? 'bg-violet-500/10 border-violet-500/40 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={promptConfig.focus_table_impact}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({ ...prev, focus_table_impact: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">Impacto na Tabela</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Contextualizar a pontuação na classificação (liderança, vaga no G4 ou fuga do Z4).
                        </div>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      promptConfig.focus_substitutions
                        ? 'bg-violet-500/10 border-violet-500/40 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={promptConfig.focus_substitutions}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({ ...prev, focus_substitutions: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">Leitura de Substituições</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Avaliar como as mexidas dos treinadores alteraram o ritmo e o desenho do jogo.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. INTEGRAÇÃO CRAWL4AI & FONTES EXTERNAS AO VIVO */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <Cpu size={15} className="text-cyan-400" />
                      Crawl4AI: Alimentação Automática de Cobertura & Fontes
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      Microserviço Ativo
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Quando ativado, o agente descobre automaticamente a URL de cobertura da partida nos portais cadastrados e extrai os lances narrados por jornalistas em campo, eliminando comentários repetitivos de posse de bola.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    <label className={`md:col-span-6 p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      promptConfig.enable_crawl4ai
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={promptConfig.enable_crawl4ai}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({ ...prev, enable_crawl4ai: e.target.checked }))
                        }
                        className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">Ativar Crawl4AI no Modo Automático</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          Descobrir e raspar automaticamente o tempo real da partida no início do jogo.
                        </div>
                      </div>
                    </label>

                    <div className="md:col-span-6 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <label className="block text-xs font-semibold text-white">
                        Fontes Externas Permitidas (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={promptConfig.crawl_sources}
                        onChange={(e) =>
                          setPromptConfig((prev) => ({ ...prev, crawl_sources: e.target.value }))
                        }
                        placeholder="ge.globo.com,lance.com.br,uol.com.br"
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs font-mono outline-none"
                      />
                      <div className="flex gap-1.5 pt-1 text-[9px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">ge.globo.com</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">lance.com.br</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">uol.com.br</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. REGRAS PERSONALIZADAS DO USUÁRIO */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-2">
                      <Settings2 size={15} className="text-violet-400" />
                      Regras Personalizadas do Prompt (Instruções Livres)
                    </label>
                    <span className="text-[10px] text-slate-500">Injetado diretamente na IA</span>
                  </div>
                  <textarea
                    rows={3}
                    value={promptConfig.custom_rules}
                    onChange={(e) =>
                      setPromptConfig((prev) => ({ ...prev, custom_rules: e.target.value }))
                    }
                    placeholder="Ex: Obedecer rigorosamente ao idioma sem estrangeirismos em inglês. Usar expressões naturais do futebol brasileiro..."
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs outline-none transition-all placeholder:text-slate-600 leading-relaxed resize-y"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Dica: Qualquer regra escrita aqui tem prioridade máxima na geração dos comentários táticos.
                  </span>
                </div>

                {/* 6. FOOTER DE AÇÃO */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setPromptConfig({
                        coach_vs_fan: 50,
                        casualness: 60,
                        live_length: 'SHORT',
                        pause_length: 'DEEP',
                        focus_highlights: true,
                        focus_table_impact: true,
                        focus_substitutions: true,
                        enable_crawl4ai: true,
                        crawl_sources: 'ge.globo.com,lance.com.br,uol.com.br',
                        custom_rules: 'Obedecer rigorosamente ao idioma sem estrangeirismos em inglês. Usar expressões naturais do futebol brasileiro.',
                      });
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer"
                  >
                    Restaurar Padrão Recomendado
                  </button>

                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-600/25"
                  >
                    {savingConfig ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Salvando Calibração...
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        Salvar e Aplicar Calibração
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
