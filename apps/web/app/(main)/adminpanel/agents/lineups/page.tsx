"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Send, 
  Eye, 
  Database, 
  Radio, 
  X, 
  Info,
  Calendar,
  Layers,
  Flame,
  Check,
  Zap,
  Globe
} from 'lucide-react';

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

interface LineupPlayer {
  id: string;
  fixtureId: string;
  teamId: number;
  player: string;
  number: number | null;
  pos: string | null;
  grid: string | null;
  isStart: boolean;
  playerPhoto?: string | null;
}

interface FixtureItem {
  id: string;
  externalId: number;
  leagueId: number;
  leagueName: string;
  module?: {
    id: string;
    name: string;
    icon: string;
  };
  homeTeam: {
    id: string;
    externalId: number;
    name: string;
    logo: string;
    startersCount: number;
  };
  awayTeam: {
    id: string;
    externalId: number;
    name: string;
    logo: string;
    startersCount: number;
  };
  date: string;
  venueName?: string | null;
  statusShort?: string;
  status: 'AVAILABLE' | 'WAITING' | 'DISPATCHED' | 'DISMISSED';
  recordingStatus: 'RECORDED' | 'MONITORING' | 'UPCOMING';
  lineupSource: string;
  isBothConfirmed: boolean;
  totalStarters: number;
  autoDispatchAt?: string;
  lineupDispatchedAt?: string | null;
  target: string;
  appSlug: string;
  suggestedTitle: string;
  suggestedBody: string;
}

interface DashboardResponse {
  success: boolean;
  totalMatchesToday: number;
  recordedMatchesToday: number;
  monitoringMatchesToday: number;
  upcomingMatchesToday: number;
  dispatchedPushesToday: number;
  count: number;
  fixtures: FixtureItem[];
}

interface AgentTelemetry {
  pocketbaseSuccessCount: number;
  uolSuccessCount?: number;
  espnSuccessCount: number;
  globoesporteSuccessCount: number;
  livescoreSuccessCount?: number;
  besoccerSuccessCount?: number;
  sofascoreSuccessCount: number;
  fotmobSuccessCount: number;
  lastRunAt: string | null;
  totalLineupsDispatched: number;
}

interface SourceHealthItem {
  id: string;
  name: string;
  badge: string;
  status: 'ONLINE' | 'BLOCKED' | 'DEPRECATED';
  statusLabel: string;
  description: string;
  color: string;
  successCount?: number;
}

interface AgentStatusResponse {
  status: string;
  agent: string;
  strategy: string;
  sources: string[];
  sourcesHealth?: SourceHealthItem[];
  telemetry: AgentTelemetry;
}

export default function LineupAgentPage() {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardResponse | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingNow, setSyncingNow] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recorded' | 'monitoring' | 'upcoming' | 'dispatched'>('all');
  
  // Feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal de Detalhes de Escalação
  const [selectedFixture, setSelectedFixture] = useState<FixtureItem | null>(null);
  const [modalLineups, setModalLineups] = useState<LineupPlayer[]>([]);
  const [loadingLineupDetails, setLoadingLineupDetails] = useState(false);

  // Ações de Disparo
  const [dispatchingFixtureId, setDispatchingFixtureId] = useState<number | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/notifications/lineups-dashboard`),
        fetch(`${API_URL}/lineups/status`),
      ]);

      if (dashRes.ok) {
        const dashData: DashboardResponse = await dashRes.json();
        if (dashData.success && Array.isArray(dashData.fixtures)) {
          setFixtures(dashData.fixtures);
          setDashboardStats(dashData);
        }
      }

      if (statusRes.ok) {
        const statusData: AgentStatusResponse = await statusRes.json();
        setAgentStatus(statusData);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do Lineup Agent:", err);
      showToast('error', 'Falha ao conectar com o serviço do Lineup Agent.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // Auto-refresh a cada 20s
    return () => clearInterval(interval);
  }, []);

  const handleForceScan = async () => {
    try {
      setSyncingNow(true);
      const res = await fetch(`${API_URL}/lineups/sync-now`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        showToast(
          'success',
          `Varredura concluída com sucesso! ${data.scannedMatches || 0} jogos analisados na janela de 4h.`
        );
        await loadData();
      } else {
        showToast('error', 'Falha ao executar varredura imediata.');
      }
    } catch (e: any) {
      showToast('error', `Erro na requisição: ${e.message}`);
    } finally {
      setSyncingNow(false);
    }
  };

  const handleOpenLineupModal = async (fixture: FixtureItem) => {
    setSelectedFixture(fixture);
    setLoadingLineupDetails(true);
    setModalLineups([]);

    try {
      const res = await fetch(`${API_URL}/fixtures/${fixture.id}/lineups`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setModalLineups(data);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar jogadores da escalação:", e);
    } finally {
      setLoadingLineupDetails(false);
    }
  };

  const handleDispatchPush = async (fixture: FixtureItem) => {
    if (fixture.totalStarters < 22) {
      if (!confirm(`Esta partida possui apenas ${fixture.totalStarters}/22 titulares confirmados. Deseja disparar o push mesmo assim?`)) {
        return;
      }
    }

    try {
      setDispatchingFixtureId(fixture.externalId);
      const res = await fetch(`${API_URL}/notifications/lineups/${fixture.externalId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fixture.suggestedTitle,
          body: fixture.suggestedBody,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Push de escalação disparado com sucesso para ${fixture.target}!`);
        await loadData();
      } else {
        showToast('error', data.message || 'Falha ao disparar push de escalação.');
      }
    } catch (e: any) {
      showToast('error', `Erro ao disparar: ${e.message}`);
    } finally {
      setDispatchingFixtureId(null);
    }
  };

  const handleDismiss = async (fixture: FixtureItem) => {
    try {
      const res = await fetch(`${API_URL}/notifications/lineups/${fixture.externalId}/dismiss`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('info', `Alerta de ${fixture.homeTeam.name} x ${fixture.awayTeam.name} descartado.`);
        await loadData();
      }
    } catch (e) {
      showToast('error', 'Falha ao descartar alerta.');
    }
  };

  // Filtragem
  const filteredFixtures = fixtures.filter((f) => {
    if (filter === 'recorded') return f.isBothConfirmed;
    if (filter === 'monitoring') return f.recordingStatus === 'MONITORING';
    if (filter === 'upcoming') return f.recordingStatus === 'UPCOMING';
    if (filter === 'dispatched') return f.status === 'DISPATCHED';
    return true;
  });

  const recordedCount = fixtures.filter((f) => f.isBothConfirmed).length;
  const monitoringCount = fixtures.filter((f) => f.recordingStatus === 'MONITORING').length;
  const upcomingCount = fixtures.filter((f) => f.recordingStatus === 'UPCOMING').length;
  const dispatchedCount = fixtures.filter((f) => f.status === 'DISPATCHED').length;

  const formatMatchTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    } catch {
      return '--:--';
    }
  };

  const getMatchStatusBadge = (statusShort?: string) => {
    const s = (statusShort || 'NS').toUpperCase();
    if (['FT', 'AET', 'PEN'].includes(s)) {
      return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-black text-[10px] border border-slate-700">FINALIZADO</span>;
    }
    if (['1H', '2H', 'HT', 'LIVE', 'ET', 'P'].includes(s)) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-black text-[10px] border border-rose-500/30 animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>AO VIVO ({s})</span>
        </span>
      );
    }
    return <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold text-[10px] border border-blue-500/20">AGENDADO</span>;
  };

  const getRecordingBadge = (fixture: FixtureItem) => {
    if (fixture.isBothConfirmed) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>GRAVADO (22/22)</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-[10px]">
            {fixture.lineupSource}
          </span>
        </div>
      );
    }

    if (fixture.recordingStatus === 'MONITORING') {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center gap-1">
          <Clock size={13} className="text-amber-400 animate-spin" />
          <span>MONITORANDO (A CADA 2M)</span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs font-bold flex items-center gap-1">
        <Clock size={13} />
        <span>A FAZER (SÚMULA ~50M ANTES)</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${
          notification.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300' 
            : notification.type === 'error'
            ? 'bg-rose-950/95 border-rose-500/40 text-rose-300'
            : 'bg-cyan-950/95 border-cyan-500/40 text-cyan-300'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle size={20} className="text-rose-400 shrink-0" />}
          {notification.type === 'info' && <Info size={20} className="text-cyan-400 shrink-0" />}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Navegação e Badges de Topo */}
      <div className="flex items-center justify-between">
        <Link 
          href="/adminpanel/agents"
          className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Central de Agentes</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>AUTÔNOMO ATIVO</span>
          </span>
          <span className="badge bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold">CRON 2M</span>
        </div>
      </div>

      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Lineup <span className="text-cyan-400">Agent</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Auditoria e Acompanhamento Diário em Tempo Real
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Captura antecipada de escalações oficiais (22 titulares com posições e fotos) via <strong className="text-white">ESPN Core API</strong> e contingências. Atualização instantânea via WebSocket e Push automático 10 min pré-jogo.
          </p>
        </div>

        {/* Ações Globais */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={loadData}
            disabled={loading || syncingNow}
            className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 transition-all shadow-md"
            title="Recarregar Dados"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-cyan-400" : "text-slate-300"} />
          </button>
          <button
            onClick={handleForceScan}
            disabled={syncingNow || loading}
            className="flex-1 lg:flex-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 tracking-wider uppercase"
          >
            <Sparkles size={18} className={syncingNow ? "animate-spin text-slate-950" : "text-slate-950"} />
            <span>{syncingNow ? "VARRENDO AGORA..." : "FORÇAR VARREDURA AGORA"}</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas & Telemetria Diária */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Status */}
        <div className="card p-5 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status do Agente</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3">ONLINE</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Varredura a cada 2 min • Última: {agentStatus?.telemetry?.lastRunAt ? new Date(agentStatus.telemetry.lastRunAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Recente'}
          </p>
        </div>

        {/* Card 2: Progresso das Escalações do Dia */}
        <div className="card p-5 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gravadas Hoje</span>
            <Database size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3">
            {recordedCount} <span className="text-sm font-normal text-slate-400">de {fixtures.length} jogos</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${fixtures.length > 0 ? (recordedCount / fixtures.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 3: Fonte Principal Aberta */}
        <div className="card p-5 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fonte Primária</span>
            <Zap size={18} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-3">ESPN Core API</div>
          <p className="text-[11px] text-slate-400 mt-1">100% Aberta • Imune a WAF Cloudflare</p>
        </div>

        {/* Card 4: Pushes Disparados */}
        <div className="card p-5 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pushes de Escalação</span>
            <Send size={18} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-3">
            {dispatchedCount} Disparados
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Auto-dispatch a 10 min do apito inicial</p>
        </div>
      </div>

      {/* Fontes de Dados em Monitoramento Concorrente */}
      <div className="card p-6 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-900/40 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Monitoramento Concorrente de Fontes (Zero Cota API-Football)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Varredura paralela multicanal • Sincronização UTC/BRT automática
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Card 0: PocketBase */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-purple-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  0. Buffer PocketBase
                </span>
                <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-200 font-bold">
                  BUFFER SSOT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Ingestão prioritária e cache local em tempo real (match_lineups).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.pocketbaseSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 1: UOL Placar */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  1. UOL Placar
                </span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-bold">
                  NACIONAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Cobertura especializada Brasil (Séries A/B, Estaduais e Copas).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.uolSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 2: ESPN Core API */}
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  2. ESPN Core API
                </span>
                <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-200 font-bold">
                  INTERNACIONAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                API pública sem WAF com fotos e escalações oficiais.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.espnSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 3: 365Scores */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  3. 365Scores
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200 font-bold">
                  MULTI-LIGA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                800+ jogos/dia, titulares com grid tático e escalações confirmadas.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.globoesporteSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 4: LiveScore API */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-blue-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  4. LiveScore API
                </span>
                <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-200 font-bold">
                  MUNDIAL ABERTO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                255 competições mundiais abertas, posições e reservas.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.livescoreSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 5: BeSoccer Global */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col justify-between">
            <div>
              <div className="font-bold text-indigo-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  5. BeSoccer Global
                </span>
                <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-200 font-bold">
                  CONTINGÊNCIA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                API pública global aberta como contingência suplementar.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.besoccerSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 6: Sofascore API */}
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="font-bold text-red-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  6. Sofascore API
                </span>
                <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-200 font-bold">
                  WAF CLOUDFLARE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Desafio Cloudflare ativo (403 Forbidden). Mantido como fallback contingencial.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-red-500/20 flex items-center justify-between text-[11px]">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Bloqueando (WAF)
              </span>
              <span className="text-slate-400 font-mono">
                {agentStatus?.telemetry?.sofascoreSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>

          {/* Card 7: FotMob API */}
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30 flex flex-col justify-between opacity-70 hover:opacity-100 transition-opacity">
            <div>
              <div className="font-bold text-rose-300/80 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  7. FotMob API
                </span>
                <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300 font-bold">
                  INOPERANTE 404
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Endpoints legados descontinuados pelo provedor (substituído por 365Scores e LiveScore).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-900/30 flex items-center justify-between text-[11px]">
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Inoperante (404)
              </span>
              <span className="text-slate-500 font-mono">
                {agentStatus?.telemetry?.fotmobSuccessCount ?? 0} sincronizados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção das Partidas do Dia */}
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-cyan-400" />
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Grade Completa de Partidas de Hoje</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {fixtures.length} jogos
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white text-black font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos ({fixtures.length})
            </button>
            <button
              onClick={() => setFilter('recorded')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'recorded'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Gravadas (22/22) ({recordedCount})</span>
            </button>
            <button
              onClick={() => setFilter('monitoring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'monitoring'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-amber-500/20'
              }`}
            >
              <Clock size={13} />
              <span>Monitorando ({monitoringCount})</span>
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'upcoming'
                  ? 'bg-slate-300 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Clock size={13} />
              <span>A Fazer ({upcomingCount})</span>
            </button>
            <button
              onClick={() => setFilter('dispatched')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'dispatched'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20'
              }`}
            >
              <Send size={13} />
              <span>Push Disparado ({dispatchedCount})</span>
            </button>
          </div>
        </div>

        {/* Lista de Partidas */}
        {loading && fixtures.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-wider">Carregando grade diária de partidas...</p>
          </div>
        ) : filteredFixtures.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800">
            <Users size={32} className="mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="text-sm font-bold text-white">Nenhuma partida encontrada neste filtro.</p>
            <p className="text-xs mt-1">Selecione outro filtro acima para visualizar os confrontos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFixtures.map((fixture) => {
              const isConfirmed = fixture.isBothConfirmed;
              const isDispatched = fixture.status === 'DISPATCHED';

              return (
                <div 
                  key={fixture.id} 
                  className={`card p-5 transition-all border ${
                    isConfirmed 
                      ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/80 to-slate-900/40 shadow-lg shadow-emerald-950/20' 
                      : fixture.recordingStatus === 'MONITORING'
                      ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/80 to-slate-900/40'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Informações da Partida */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-bold text-white flex items-center gap-1.5">
                          <span>{fixture.module?.icon || '⚽'}</span>
                          <span>{fixture.leagueName}</span>
                        </span>
                        
                        {getMatchStatusBadge(fixture.statusShort)}

                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatMatchTime(fixture.date)} (Brasília)</span>
                        </span>

                        {fixture.venueName && (
                          <span className="text-slate-400 text-[11px] truncate max-w-xs">
                            • {fixture.venueName}
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-[10px]">
                          Target: {fixture.target}
                        </span>
                      </div>

                      {/* Confronto */}
                      <div className="flex items-center gap-4">
                        {/* Mandante */}
                        <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                          <span className="text-sm md:text-base font-black text-white truncate">
                            {fixture.homeTeam.name}
                          </span>
                          {fixture.homeTeam.logo ? (
                            <img 
                              src={fixture.homeTeam.logo} 
                              alt={fixture.homeTeam.name} 
                              className="w-7 h-7 object-contain shrink-0" 
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">
                              {fixture.homeTeam.name.substring(0, 2)}
                            </div>
                          )}
                        </div>

                        <div className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-black text-slate-400 shrink-0 border border-slate-700">
                          VS
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center gap-2.5 flex-1 text-left">
                          {fixture.awayTeam.logo ? (
                            <img 
                              src={fixture.awayTeam.logo} 
                              alt={fixture.awayTeam.name} 
                              className="w-7 h-7 object-contain shrink-0" 
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">
                              {fixture.awayTeam.name.substring(0, 2)}
                            </div>
                          )}
                          <span className="text-sm md:text-base font-black text-white truncate">
                            {fixture.awayTeam.name}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso e Status de Gravação */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden flex border border-slate-700/50">
                          <div 
                            className="bg-cyan-500 h-full transition-all"
                            style={{ width: `${(fixture.homeTeam.startersCount / 11) * 50}%` }}
                            title={`Mandante: ${fixture.homeTeam.startersCount}/11`}
                          />
                          <div 
                            className="bg-indigo-500 h-full transition-all"
                            style={{ width: `${(fixture.awayTeam.startersCount / 11) * 50}%` }}
                            title={`Visitante: ${fixture.awayTeam.startersCount}/11`}
                          />
                        </div>
                        <span className="text-xs font-bold text-white shrink-0">
                          {fixture.totalStarters}/22 Titulares
                        </span>
                      </div>
                    </div>

                    {/* Status & Ações */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      {/* Badges de Gravação & Push */}
                      <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
                        {getRecordingBadge(fixture)}

                        {isDispatched && (
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black flex items-center gap-1.5">
                            <Send size={14} />
                            <span>PUSH DISPARADO</span>
                          </span>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-2">
                        {fixture.totalStarters > 0 && (
                          <button
                            onClick={() => handleOpenLineupModal(fixture)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 shadow-sm"
                          >
                            <Eye size={14} className="text-cyan-400" />
                            <span>Ver 22 Titulares</span>
                          </button>
                        )}

                        {isConfirmed && !isDispatched && (
                          <button
                            onClick={() => handleDispatchPush(fixture)}
                            disabled={dispatchingFixtureId === fixture.externalId}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 uppercase"
                          >
                            <Send size={14} className={dispatchingFixtureId === fixture.externalId ? "animate-spin" : ""} />
                            <span>DISPARAR PUSH</span>
                          </button>
                        )}

                        {!isDispatched && (
                          <button
                            onClick={() => handleDismiss(fixture)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                            title="Descartar alerta desta partida"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Escalação */}
      {selectedFixture && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  <span>Escalação Oficial Persistida no PostgreSQL</span>
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {selectedFixture.homeTeam.name} x {selectedFixture.awayTeam.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fonte: <strong className="text-white">{selectedFixture.lineupSource}</strong> • Liga: {selectedFixture.leagueName}
                </p>
              </div>
              <button
                onClick={() => setSelectedFixture(null)}
                className="p-2.5 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/30">
              {loadingLineupDetails ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-xs font-bold uppercase">Carregando lista de titulares e fotos...</p>
                </div>
              ) : modalLineups.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle size={28} className="mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="text-sm font-bold text-white">Nenhum jogador registrado no banco ainda.</p>
                  <p className="text-xs mt-1">O Lineup Agent aguarda a publicação oficial.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Mandante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                      {selectedFixture.homeTeam.logo && (
                        <img 
                          src={selectedFixture.homeTeam.logo} 
                          alt={selectedFixture.homeTeam.name} 
                          className="w-6 h-6 object-contain" 
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-black text-white truncate">
                          {selectedFixture.homeTeam.name}
                        </h4>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase">11 Titulares</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {modalLineups
                        .filter((p) => p.teamId === selectedFixture.homeTeam.externalId && p.isStart)
                        .map((player) => (
                          <div 
                            key={player.id} 
                            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {player.playerPhoto ? (
                                <img 
                                  src={player.playerPhoto} 
                                  alt={player.player} 
                                  className="w-7 h-7 rounded-full object-cover bg-slate-800 shrink-0 border border-slate-700" 
                                />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-cyan-500/20">
                                  {player.number ?? '-'}
                                </span>
                              )}
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">
                                  {player.player}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Camisa #{player.number ?? '-'}
                                </span>
                              </div>
                            </div>
                            {player.pos && (
                              <span className="text-[10px] font-black text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/20">
                                {player.pos}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Visitante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                      {selectedFixture.awayTeam.logo && (
                        <img 
                          src={selectedFixture.awayTeam.logo} 
                          alt={selectedFixture.awayTeam.name} 
                          className="w-6 h-6 object-contain" 
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-black text-white truncate">
                          {selectedFixture.awayTeam.name}
                        </h4>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase">11 Titulares</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {modalLineups
                        .filter((p) => p.teamId === selectedFixture.awayTeam.externalId && p.isStart)
                        .map((player) => (
                          <div 
                            key={player.id} 
                            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {player.playerPhoto ? (
                                <img 
                                  src={player.playerPhoto} 
                                  alt={player.player} 
                                  className="w-7 h-7 rounded-full object-cover bg-slate-800 shrink-0 border border-slate-700" 
                                />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/20">
                                  {player.number ?? '-'}
                                </span>
                              )}
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">
                                  {player.player}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Camisa #{player.number ?? '-'}
                                </span>
                              </div>
                            </div>
                            {player.pos && (
                              <span className="text-[10px] font-black text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/20">
                                {player.pos}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
