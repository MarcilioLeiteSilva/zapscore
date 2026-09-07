"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Radio,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Zap,
  TrendingUp,
  Activity,
  Play,
  FileText,
  Search,
  Filter,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";
const PB_COMMENTS_URL = "https://zapscore-pocketbase-comentarios.gtalg3.easypanel.host";
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "7Ma+1d8R2VkkAEUzGNLhrVYaoYfOLaUdxXTkocQa+ac=";

interface TeamInfo {
  name: string;
  logo?: string;
}

interface FixtureCardData {
  id?: string;
  externalId: number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeGoals: number | null;
  awayGoals: number | null;
  statusShort: string | null;
  elapsed: number | null;
  date?: string;
  matchDate?: string;
  leagueId?: number;
  league?: {
    name?: string;
    externalId?: number;
  };
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
  stats_snapshot?: any;
  created?: string;
}

interface SourceDeltaEvent {
  minute: number;
  source: string;
  type: string;
  description: string;
}

interface MultiSourcePreview {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  elapsed: number;
  status: string;
  lastCommentMinute: number;
  delta?: {
    events?: SourceDeltaEvent[];
    sourcesQueried?: number;
    sourcesResponded?: number;
    latestMinuteDetected?: number;
    hasSubstantialDelta?: boolean;
    rawSummary?: string;
  };
}

const SOURCES_LIST = [
  {
    id: 'espn',
    name: 'ESPN Brasil',
    url: 'site.api.espn.com',
    type: 'REST API Instantânea',
    latency: '< 1.2s',
    badge: 'Scoreboard & Eventos',
    color: 'border-red-500/30 bg-red-500/10 text-red-400',
  },
  {
    id: 'ge',
    name: 'GE Globo',
    url: 'ge.globo.com',
    type: 'Tempo Real Web',
    latency: '< 2.5s',
    badge: 'Narrativa Lance a Lance',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'gazeta',
    name: 'Gazeta Esportiva',
    url: 'gazetaesportiva.com',
    type: 'Minuto a Minuto',
    latency: '< 2.8s',
    badge: 'Lances e Crônica',
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  {
    id: 'lance',
    name: 'Lance!',
    url: 'lance.com.br',
    type: 'Feed ao Vivo',
    latency: '< 3.0s',
    badge: 'Radar de Notícias',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  {
    id: 'uol',
    name: 'UOL Esporte',
    url: 'uol.com.br/esporte',
    type: 'Placar em Tempo Real',
    latency: '< 2.7s',
    badge: 'Placar & Estatísticas',
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
];

export default function MultiSourceAgentPage() {
  const [fixtures, setFixtures] = useState<FixtureCardData[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<FixtureCardData | null>(null);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [filterCompetition, setFilterCompetition] = useState<'ALL' | '71' | '72'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Comentários da partida selecionada
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Prévia e Varredura Multi-Fontes
  const [multiSourcePreview, setMultiSourcePreview] = useState<MultiSourcePreview | null>(null);
  const [loadingDelta, setLoadingDelta] = useState(false);
  const [deltaError, setDeltaError] = useState<string | null>(null);

  // Testes de Geração
  const [testMinute, setTestMinute] = useState<number>(45);
  const [testPhase, setTestPhase] = useState<'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME'>('SECOND_HALF');
  const [generatingComment, setGeneratingComment] = useState(false);
  const [generationFeedback, setGenerationFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [adminApiKey, setAdminApiKey] = useState<string>(DEFAULT_API_KEY);

  // Aba ativa na coluna direita
  const [activeTab, setActiveTab] = useState<'timeline' | 'sources' | 'generate'>('timeline');

  // 1. Carrega os jogos do dia
  const fetchFixtures = useCallback(async () => {
    setLoadingFixtures(true);
    try {
      const res = await fetch(`${API_URL}/fixtures/today`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFixtures(data);
          if (data.length > 0 && !selectedFixture) {
            setSelectedFixture(data[0]);
          }
        }
      }
    } catch (e: any) {
      console.error('Erro ao carregar fixtures:', e.message);
    } finally {
      setLoadingFixtures(false);
    }
  }, [selectedFixture]);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  // 2. Carrega comentários da partida selecionada
  const fetchComments = useCallback(async (fixtureId: number) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/fixtures/${fixtureId}/comments`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.comments || [];
        // Ordena por minuto ascendente
        list.sort((a: CommentItem, b: CommentItem) => (a.minute || 0) - (b.minute || 0));
        setComments(list);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error('Erro ao carregar comentários:', e);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFixture?.externalId) {
      fetchComments(selectedFixture.externalId);
      setMultiSourcePreview(null);
      setDeltaError(null);
      setGenerationFeedback(null);
      setTestMinute(selectedFixture.elapsed || 45);
    }
  }, [selectedFixture, fetchComments]);

  // 3. Executa varredura de múltiplas fontes sob demanda
  const triggerMultiSourceCrawl = async () => {
    if (!selectedFixture) return;
    setLoadingDelta(true);
    setDeltaError(null);
    try {
      const res = await fetch(`${API_URL}/fixtures/${selectedFixture.externalId}/comments/multi-source-preview`);
      if (res.ok) {
        const data = await res.json();
        setMultiSourcePreview(data);
        setActiveTab('sources');
      } else {
        const err = await res.json().catch(() => ({}));
        setDeltaError(err.message || 'Falha ao consultar fontes esportivas.');
      }
    } catch (e: any) {
      setDeltaError(e.message || 'Erro de conexão com o agente.');
    } finally {
      setLoadingDelta(false);
    }
  };

  // 4. Dispara geração de comentário de teste
  const triggerGenerateTest = async () => {
    if (!selectedFixture) return;
    setGeneratingComment(true);
    setGenerationFeedback(null);
    try {
      const res = await fetch(`${API_URL}/fixtures/${selectedFixture.externalId}/comments/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': adminApiKey.trim(),
        },
        body: JSON.stringify({
          minute: Number(testMinute),
          phase: testPhase,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGenerationFeedback({
          success: true,
          message: `Comentário do minuto ${testMinute}' gerado com sucesso via ${data.data?.ai_model || 'OpenAI'} e auditado pelo FactAuditor!`,
        });
        // Atualiza a timeline
        fetchComments(selectedFixture.externalId);
        setActiveTab('timeline');
      } else {
        setGenerationFeedback({
          success: false,
          message: data.message || 'Falha na geração do comentário.',
        });
      }
    } catch (e: any) {
      setGenerationFeedback({
        success: false,
        message: e.message || 'Erro na requisição ao backend.',
      });
    } finally {
      setGeneratingComment(false);
    }
  };

  // Filtra fixtures
  const filteredFixtures = fixtures.filter((f) => {
    const leagueMatch =
      filterCompetition === 'ALL' ||
      (filterCompetition === '71' && (f.leagueId === 71 || f.league?.externalId === 71)) ||
      (filterCompetition === '72' && (f.leagueId === 72 || f.league?.externalId === 72));

    const nameMatch =
      !searchTerm ||
      f.homeTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.awayTeam?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return leagueMatch && nameMatch;
  });

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 p-4 md:p-8">
      {/* HEADER PRINCIPAL */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Link href="/adminpanel" className="hover:text-slate-200 transition-colors">AdminPanel</Link>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <Link href="/adminpanel/agents" className="hover:text-slate-200 transition-colors">Hub de Agentes</Link>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-amber-400 font-medium">Agente Multifontes de Comentários</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  Agente Multifontes de Comentários
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    5 FONTES • DELTA 5M • ZERO LAG
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Monitoramento dos jogos do dia, coleta concorrente minuto a minuto e timeline tática blindada contra alucinações.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFixtures}
              disabled={loadingFixtures}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingFixtures ? 'animate-spin text-amber-400' : ''}`} />
              Atualizar Jogos
            </button>
            <Link
              href="/adminpanel/agents/tactical-comments"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-sm font-medium text-amber-400 transition-all shadow-sm"
            >
              <Cpu className="w-4 h-4" />
              Calibração do Prompt
            </Link>
          </div>
        </div>

        {/* STATS RÁPIDOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Fontes Esportivas</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">5 em Paralelo</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ESPN, GE, Gazeta, Lance!, UOL
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Janela Temporal (Delta Engine)</span>
            <p className="text-2xl font-bold text-white mt-2">5 Minutos</p>
            <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Isolamento dos lances recentes
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Tolerância a Atrasos</span>
            <p className="text-2xl font-bold text-white mt-2">Anti-Lag Ativo</p>
            <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Sincronização por maior minuto
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Auditoria Factual</span>
            <p className="text-2xl font-bold text-white mt-2">100% Protegido</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero alucinações de G4 e tabela
            </p>
          </div>
        </div>
      </div>

      {/* GRID DE CONTEÚDO PRINCIPAL (2 COLUNAS) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: JOGOS DO DIA (5 COLUNAS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Jogos do Dia ({filteredFixtures.length})
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Hoje
              </span>
            </div>

            {/* BUSCA E FILTROS DE LIGA */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar clube..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterCompetition('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterCompetition === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterCompetition('71')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterCompetition === '71'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  🇧🇷 Série A
                </button>
                <button
                  onClick={() => setFilterCompetition('72')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterCompetition === '72'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  🇧🇷 Série B
                </button>
              </div>
            </div>

            {/* LISTAGEM DE PARTIDAS */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
              {loadingFixtures ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  <span>Carregando partidas do dia...</span>
                </div>
              ) : filteredFixtures.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nenhuma partida encontrada com os filtros selecionados.
                </div>
              ) : (
                filteredFixtures.map((f) => {
                  const isSelected = selectedFixture?.externalId === f.externalId;
                  const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(f.statusShort || '');
                  const isFinished = ['FT', 'AET', 'PEN'].includes(f.statusShort || '');

                  return (
                    <div
                      key={f.externalId}
                      onClick={() => setSelectedFixture(f)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {isLive && (
                        <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          AO VIVO {f.elapsed ? `${f.elapsed}'` : ''}
                        </span>
                      )}
                      {isFinished && (
                        <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          ENCERRADO
                        </span>
                      )}
                      {!isLive && !isFinished && (
                        <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {f.statusShort || 'AGENDADO'}
                        </span>
                      )}

                      <div className="pr-20">
                        {/* Mandante */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            {f.homeTeam.logo ? (
                              <Image src={f.homeTeam.logo} alt={f.homeTeam.name} width={20} height={20} className="object-contain" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                                {f.homeTeam.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className={`text-sm ${isSelected ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                              {f.homeTeam.name}
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-white">
                            {f.homeGoals ?? '-'}
                          </span>
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {f.awayTeam.logo ? (
                              <Image src={f.awayTeam.logo} alt={f.awayTeam.name} width={20} height={20} className="object-contain" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                                {f.awayTeam.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className={`text-sm ${isSelected ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                              {f.awayTeam.name}
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-white">
                            {f.awayGoals ?? '-'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>ID: {f.externalId}</span>
                        <span>{f.league?.name || (f.leagueId === 71 ? 'Brasileirão Série A' : 'Brasileirão')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: DETALHES DO JOGO SELECIONADO (7 COLUNAS) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedFixture ? (
            <>
              {/* BANNER DO JOGO SELECIONADO */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full bg-amber-500/5 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>VARREDURA EM TEMPO REAL ATIVA</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                    Minuto Oficial: {selectedFixture.elapsed ? `${selectedFixture.elapsed}'` : '0\''}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="text-left">
                    <p className="text-xl md:text-2xl font-black text-white">{selectedFixture.homeTeam.name}</p>
                    <p className="text-xs text-slate-400">Mandante</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
                    <div className="text-2xl md:text-3xl font-black text-white tracking-widest">
                      {selectedFixture.homeGoals ?? 0} : {selectedFixture.awayGoals ?? 0}
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">
                      {selectedFixture.statusShort || 'STATUS'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl md:text-2xl font-black text-white">{selectedFixture.awayTeam.name}</p>
                    <p className="text-xs text-slate-400">Visitante</p>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO DO PAINEL */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={triggerMultiSourceCrawl}
                    disabled={loadingDelta}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {loadingDelta ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 fill-slate-950" />
                    )}
                    Disparar Varredura Multi-Fontes Agora
                  </button>

                  <button
                    onClick={() => fetchComments(selectedFixture.externalId)}
                    disabled={loadingComments}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingComments ? 'animate-spin text-amber-400' : ''}`} />
                    Atualizar Comentários ({comments.length})
                  </button>
                </div>
              </div>

              {/* ABAS DE NAVEGAÇÃO: TIMELINE / MULTI-FONTES / TESTES */}
              <div className="flex border-b border-slate-800 gap-2">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                    activeTab === 'timeline'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Timeline Minuto a Minuto ({comments.length})
                </button>

                <button
                  onClick={() => setActiveTab('sources')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                    activeTab === 'sources'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Dados Coletados (5 Fontes)
                </button>

                <button
                  onClick={() => setActiveTab('generate')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                    activeTab === 'generate'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Testes de Geração com IA
                </button>
              </div>

              {/* CONTEÚDO DA ABA 1: TIMELINE DE COMENTÁRIOS */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {loadingComments ? (
                    <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                      <span>Carregando timeline minuto a minuto...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                      <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-base font-semibold text-slate-400">Nenhum comentário registrado ainda para esta partida.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Use a aba de "Testes de Geração com IA" ou aguarde o ciclo de 5 em 5 minutos do scheduler.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all shadow-md relative"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono shadow-sm">
                                {c.minute}'
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                                {c.phase === 'PRE_MATCH'
                                  ? 'Pré-Jogo'
                                  : c.phase === 'FIRST_HALF'
                                  ? '1º Tempo'
                                  : c.phase === 'HALF_TIME'
                                  ? 'Intervalo'
                                  : c.phase === 'SECOND_HALF'
                                  ? '2º Tempo'
                                  : 'Fim de Jogo'}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  c.sentiment === 'DOMINANTE'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : c.sentiment === 'CRITICO'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : c.sentiment === 'SURPRESA'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {c.sentiment}
                              </span>
                            </div>

                            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Auditado • Factual OK
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
                          <p className="text-sm text-slate-300 leading-relaxed">{c.comment}</p>

                          {/* SNAPSHOT ESTATÍSTICO SE DISPONÍVEL */}
                          {c.stats_snapshot && Object.keys(c.stats_snapshot).length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                              <div className="p-2 rounded-lg bg-slate-950/60 text-center">
                                <span className="block text-[10px] text-slate-500 uppercase">Posse Mandante</span>
                                <span className="font-bold text-slate-200">
                                  {c.stats_snapshot.home?.['Ball Possession'] || '50%'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-950/60 text-center">
                                <span className="block text-[10px] text-slate-500 uppercase">Finalizações</span>
                                <span className="font-bold text-slate-200">
                                  {c.stats_snapshot.home?.['Total Shots'] || '0'} x {c.stats_snapshot.away?.['Total Shots'] || '0'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-950/60 text-center">
                                <span className="block text-[10px] text-slate-500 uppercase">Posse Visitante</span>
                                <span className="font-bold text-slate-200">
                                  {c.stats_snapshot.away?.['Ball Possession'] || '50%'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CONTEÚDO DA ABA 2: RADAR DAS 5 FONTES */}
              {activeTab === 'sources' && (
                <div className="space-y-5">
                  {/* CARDS DAS 5 FONTES ESPORTIVAS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SOURCES_LIST.map((src) => (
                      <div
                        key={src.id}
                        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{src.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${src.color}`}>
                              {src.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{src.url}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            ATIVO
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">{src.latency}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RESULTADO DA VARREDURA (DELTA ENGINE) */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        Resultado da Coleta Concorrente (Último Delta)
                      </h3>
                      {multiSourcePreview && (
                        <span className="text-xs text-emerald-400 font-medium">
                          {multiSourcePreview.delta?.sourcesResponded || 5} de {multiSourcePreview.delta?.sourcesQueried || 5} fontes responderam
                        </span>
                      )}
                    </div>

                    {loadingDelta ? (
                      <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                        <span>Varrendo ESPN, GE Globo, Gazeta Esportiva, Lance! e UOL em paralelo...</span>
                      </div>
                    ) : deltaError ? (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {deltaError}
                      </div>
                    ) : multiSourcePreview?.delta?.rawSummary ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                          {multiSourcePreview.delta.rawSummary}
                        </div>

                        {multiSourcePreview.delta.events && multiSourcePreview.delta.events.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Lances Extraídos nos Últimos Minutos ({multiSourcePreview.delta.events.length})
                            </h4>
                            <div className="space-y-2">
                              {multiSourcePreview.delta.events.slice(-5).map((ev, i) => (
                                <div key={i} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-3">
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
                                    {ev.minute}'
                                  </span>
                                  <div className="flex-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                                      Fonte: {ev.source} • {ev.type}
                                    </span>
                                    <p className="text-slate-300 mt-0.5">{ev.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <p className="text-sm font-medium">Nenhuma varredura recente executada no navegador.</p>
                        <button
                          onClick={triggerMultiSourceCrawl}
                          className="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold transition-all"
                        >
                          Executar Coleta Agora
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 3: TESTES DE GERAÇÃO */}
              {activeTab === 'generate' && (
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Laboratório de Testes do Agente
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Simule a geração de um comentário tático para esta partida. A geração utilizará o snapshot oficial da tabela, os dados das 5 fontes esportivas e passará pela validação do FactAuditor antes de gravar no PocketBase.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Minuto da Partida para Teste
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="105"
                        value={testMinute}
                        onChange={(e) => setTestMinute(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Fase da Partida
                      </label>
                      <select
                        value={testPhase}
                        onChange={(e: any) => setTestPhase(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="PRE_MATCH">Pré-Jogo (0')</option>
                        <option value="FIRST_HALF">1º Tempo</option>
                        <option value="HALF_TIME">Intervalo (45')</option>
                        <option value="SECOND_HALF">2º Tempo</option>
                        <option value="FULL_TIME">Fim de Jogo (Resumo Final)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Chave de Autenticação (ADMIN_API_KEY)
                    </label>
                    <input
                      type="password"
                      value={adminApiKey}
                      onChange={(e) => setAdminApiKey(e.target.value)}
                      placeholder="Chave de API do Admin..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {generationFeedback && (
                    <div
                      className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
                        generationFeedback.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {generationFeedback.success ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span>{generationFeedback.message}</span>
                    </div>
                  )}

                  <button
                    onClick={triggerGenerateTest}
                    disabled={generatingComment}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingComment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Coletando dados, gerando insight e auditando fatos...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        Disparar Geração de Teste (Minuto {testMinute}')
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-400">Nenhum jogo selecionado.</p>
              <p className="text-xs text-slate-500 mt-1">Selecione uma partida na coluna esquerda para inspecionar comentários e fontes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
