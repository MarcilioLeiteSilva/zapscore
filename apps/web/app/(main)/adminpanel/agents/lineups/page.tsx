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
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Flame,
  Check
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
  status: 'AVAILABLE' | 'WAITING' | 'DISPATCHED' | 'DISMISSED';
  isBothConfirmed: boolean;
  totalStarters: number;
  autoDispatchAt?: string;
  lineupDispatchedAt?: string | null;
  target: string;
  appSlug: string;
  suggestedTitle: string;
  suggestedBody: string;
}

interface AgentTelemetry {
  pocketbaseSuccessCount: number;
  sofascoreSuccessCount: number;
  fotmobSuccessCount: number;
  globoesporteSuccessCount: number;
  lastRunAt: string | null;
  totalLineupsDispatched: number;
}

interface AgentStatusResponse {
  status: string;
  agent: string;
  strategy: string;
  sources: string[];
  telemetry: AgentTelemetry;
}

export default function LineupAgentPage() {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingNow, setSyncingNow] = useState(false);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'waiting' | 'dispatched'>('all');
  
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
        const dashData = await dashRes.json();
        if (dashData.success && Array.isArray(dashData.fixtures)) {
          setFixtures(dashData.fixtures);
        }
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
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
    const interval = setInterval(loadData, 30000);
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
          `Varredura concluída! ${data.scannedMatches || 0} jogos analisados, ${data.syncedLineups || 0} novas escalações sincronizadas.`
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
    if (filter === 'confirmed') return f.isBothConfirmed;
    if (filter === 'waiting') return !f.isBothConfirmed && f.status !== 'DISPATCHED' && f.status !== 'DISMISSED';
    if (filter === 'dispatched') return f.status === 'DISPATCHED';
    return true;
  });

  const confirmedCount = fixtures.filter((f) => f.isBothConfirmed).length;
  const waitingCount = fixtures.filter((f) => !f.isBothConfirmed && f.status !== 'DISPATCHED').length;
  const dispatchedCount = fixtures.filter((f) => f.status === 'DISPATCHED').length;

  const formatMatchTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
            : 'bg-cyan-950/90 border-cyan-500/30 text-cyan-300'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle size={20} className="text-rose-400 shrink-0" />}
          {notification.type === 'info' && <Info size={20} className="text-cyan-400 shrink-0" />}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Navegação e Badge */}
      <div className="flex items-center justify-between">
        <Link 
          href="/adminpanel/agents"
          className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Central de Agentes</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="badge badge-live">● BUFFER POCKETBASE ATIVO</span>
          <span className="badge bg-cyan-500/10 text-cyan-400 border-cyan-500/20">CRON 2M</span>
        </div>
      </div>

      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Lineup <span style={{ color: 'var(--primary)' }}>Agent</span>
              </h1>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Monitoramento de Escalações Oficiais • Tripla Redundância + Buffer PocketBase
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl mt-2">
            Varre partidas das próximas 4 horas sem consumir cota da API-Sports. Ingestão segura via buffer PocketBase com disparo pré-jogo garantido com os 22 titulares.
          </p>
        </div>

        {/* Ações Globais */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={loadData}
            disabled={loading || syncingNow}
            className="p-3.5 bg-[var(--surface)] hover:bg-[var(--border)] text-white rounded-2xl border border-[var(--border)] transition-all"
            title="Recarregar Dados"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleForceScan}
            disabled={syncingNow || loading}
            className="flex-1 lg:flex-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 tracking-wider uppercase"
          >
            <Sparkles size={18} className={syncingNow ? "animate-spin text-black" : "text-black"} />
            <span>{syncingNow ? "VARRENDO AGORA..." : "FORÇAR VARREDURA AGORA"}</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas & Telemetria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status do Agente</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3">ONLINE</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Última execução: {agentStatus?.telemetry?.lastRunAt ? new Date(agentStatus.telemetry.lastRunAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Recente'}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Buffer PocketBase</span>
            <Database size={18} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-3">
            {agentStatus?.telemetry?.pocketbaseSuccessCount ?? 0} Sincronizados
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Buffer desacoplado da ZapScore</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Capturas Sofascore</span>
            <Radio size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-3">
            {agentStatus?.telemetry?.sofascoreSuccessCount ?? 0} Escalações
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Scraper principal em tempo real</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Disparos Push</span>
            <Send size={18} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-3">
            {dispatchedCount} Disparados
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Alertas enviados aos torcedores</p>
        </div>
      </div>

      {/* Fontes de Dados em Cascata */}
      <div className="card p-6 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-transparent to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck size={20} className="text-cyan-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Arquitetura de Tripla Redundância com Ingestão Desacoplada
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="font-bold text-purple-300 flex items-center justify-between">
              <span>1. Buffer PocketBase</span>
              <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-200">PRIORITÁRIO</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Ingestão autônoma isolada. ZapScore apenas consome o resultado aprovado.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>2. Sofascore Scraper</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">PRINCIPAL</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Captação aos 50m antes do jogo com as formações e 22 titulares.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="font-bold text-blue-300 flex items-center justify-between">
              <span>3. FotMob API</span>
              <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-200">FALLBACK 1</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Acionado se o Sofascore ainda não tiver publicado a relação oficial.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="font-bold text-emerald-300 flex items-center justify-between">
              <span>4. GloboEsporte / 365</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">FALLBACK 2</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Garante cobertura para estaduais e jogos com cobertura local.
            </p>
          </div>
        </div>
      </div>

      {/* Seção das Partidas do Dia */}
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Partidas Monitoradas no Radar</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] font-bold">
                {fixtures.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white text-black font-black'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]'
              }`}
            >
              Todas ({fixtures.length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'confirmed'
                  ? 'bg-emerald-500 text-black font-black'
                  : 'bg-[var(--surface)] text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Confirmadas ({confirmedCount})</span>
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'waiting'
                  ? 'bg-amber-500 text-black font-black'
                  : 'bg-[var(--surface)] text-amber-400 hover:text-amber-300 border border-amber-500/20'
              }`}
            >
              <Clock size={13} />
              <span>Aguardando ({waitingCount})</span>
            </button>
            <button
              onClick={() => setFilter('dispatched')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'dispatched'
                  ? 'bg-cyan-500 text-black font-black'
                  : 'bg-[var(--surface)] text-cyan-400 hover:text-cyan-300 border border-cyan-500/20'
              }`}
            >
              <Send size={13} />
              <span>Push Disparado ({dispatchedCount})</span>
            </button>
          </div>
        </div>

        {/* Lista de Partidas */}
        {loading && fixtures.length === 0 ? (
          <div className="card p-12 text-center text-[var(--text-muted)]">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-wider">Carregando partidas monitoradas...</p>
          </div>
        ) : filteredFixtures.length === 0 ? (
          <div className="card p-12 text-center text-[var(--text-muted)]">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold text-white">Nenhuma partida encontrada neste filtro.</p>
            <p className="text-xs mt-1">Aguardando próximas partidas na janela de 4 horas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFixtures.map((fixture) => {
              const isConfirmed = fixture.isBothConfirmed;
              const hasPartial = fixture.totalStarters > 0 && !isConfirmed;
              const isDispatched = fixture.status === 'DISPATCHED';

              return (
                <div 
                  key={fixture.id} 
                  className={`card p-5 transition-all border ${
                    isConfirmed 
                      ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/10 via-[var(--surface)] to-transparent' 
                      : hasPartial
                      ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/10 via-[var(--surface)] to-transparent'
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Informações da Partida */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-bold text-white flex items-center gap-1">
                          <span>{fixture.module?.icon || '⚽'}</span>
                          <span>{fixture.leagueName}</span>
                        </span>
                        <span className="text-[var(--text-muted)] font-medium flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatMatchTime(fixture.date)} (Brasília)</span>
                        </span>
                        {fixture.venueName && (
                          <span className="text-[var(--text-muted)] text-[11px] truncate max-w-xs">
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
                            <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px]">
                              {fixture.homeTeam.name.substring(0, 2)}
                            </div>
                          )}
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-[var(--border)] text-xs font-black text-[var(--text-muted)] shrink-0">
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
                            <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px]">
                              {fixture.awayTeam.name.substring(0, 2)}
                            </div>
                          )}
                          <span className="text-sm md:text-base font-black text-white truncate">
                            {fixture.awayTeam.name}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso dos Titulares */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 bg-[var(--border)] h-2 rounded-full overflow-hidden flex">
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
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border)]">
                      {/* Badges de Status */}
                      <div className="flex items-center gap-2 justify-between lg:justify-end">
                        {isConfirmed ? (
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>22 CONFIRMADOS</span>
                          </span>
                        ) : hasPartial ? (
                          <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>PARCIAL ({fixture.totalStarters}/22)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl bg-[var(--border)] text-[var(--text-muted)] text-xs font-bold flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>AGUARDANDO ESCALAÇÃO</span>
                          </span>
                        )}

                        {isDispatched && (
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black flex items-center gap-1.5">
                            <Send size={14} />
                            <span>PUSH ENVIADO</span>
                          </span>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-2">
                        {fixture.totalStarters > 0 && (
                          <button
                            onClick={() => handleOpenLineupModal(fixture)}
                            className="px-3.5 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--border)] text-white text-xs font-bold transition-all border border-[var(--border)] flex items-center gap-1.5"
                          >
                            <Eye size={14} className="text-cyan-400" />
                            <span>Ver 22 Titulares</span>
                          </button>
                        )}

                        {isConfirmed && !isDispatched && (
                          <button
                            onClick={() => handleDispatchPush(fixture)}
                            disabled={dispatchingFixtureId === fixture.externalId}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                          >
                            <Send size={14} className={dispatchingFixtureId === fixture.externalId ? "animate-spin" : ""} />
                            <span>DISPARAR PUSH</span>
                          </button>
                        )}

                        {!isDispatched && (
                          <button
                            onClick={() => handleDismiss(fixture)}
                            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-[var(--border)] transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Escalação Oficial do Confronto
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedFixture.homeTeam.name} x {selectedFixture.awayTeam.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFixture(null)}
                className="p-2 rounded-xl hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingLineupDetails ? (
                <div className="py-12 text-center text-[var(--text-muted)]">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-xs font-bold uppercase">Carregando lista de titulares...</p>
                </div>
              ) : modalLineups.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)]">
                  <AlertCircle size={28} className="mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="text-sm font-bold text-white">Nenhum jogador registrado no banco ainda.</p>
                  <p className="text-xs mt-1">O Lineup Agent aguarda a publicação oficial.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Mandante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      {selectedFixture.homeTeam.logo && (
                        <img 
                          src={selectedFixture.homeTeam.logo} 
                          alt={selectedFixture.homeTeam.name} 
                          className="w-5 h-5 object-contain" 
                        />
                      )}
                      <h4 className="text-sm font-black text-white truncate">
                        {selectedFixture.homeTeam.name}
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      {modalLineups
                        .filter((p) => p.teamId === selectedFixture.homeTeam.externalId)
                        .map((player) => (
                          <div 
                            key={player.id} 
                            className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {player.number ?? '-'}
                              </span>
                              <span className="font-semibold text-white truncate">
                                {player.player}
                              </span>
                            </div>
                            {player.pos && (
                              <span className="text-[10px] font-bold text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface)]">
                                {player.pos}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Visitante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      {selectedFixture.awayTeam.logo && (
                        <img 
                          src={selectedFixture.awayTeam.logo} 
                          alt={selectedFixture.awayTeam.name} 
                          className="w-5 h-5 object-contain" 
                        />
                      )}
                      <h4 className="text-sm font-black text-white truncate">
                        {selectedFixture.awayTeam.name}
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      {modalLineups
                        .filter((p) => p.teamId === selectedFixture.awayTeam.externalId)
                        .map((player) => (
                          <div 
                            key={player.id} 
                            className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {player.number ?? '-'}
                              </span>
                              <span className="font-semibold text-white truncate">
                                {player.player}
                              </span>
                            </div>
                            {player.pos && (
                              <span className="text-[10px] font-bold text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface)]">
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

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Total: {modalLineups.length} jogadores escalados
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFixture(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--border)] text-white text-xs font-bold transition-all"
                >
                  Fechar
                </button>
                {selectedFixture.isBothConfirmed && selectedFixture.status !== 'DISPATCHED' && (
                  <button
                    onClick={() => {
                      const fix = selectedFixture;
                      setSelectedFixture(null);
                      handleDispatchPush(fix);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition-all flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Disparar Push Agora</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
