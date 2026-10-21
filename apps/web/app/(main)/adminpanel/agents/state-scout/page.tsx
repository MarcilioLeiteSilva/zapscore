"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Calendar, 
  Trophy, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Camera,
  Users
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://zapscore-zapscore-api.gtalg3.easypanel.host";

interface TelemetryDriver {
  name: string;
  leagueExternalId: number;
  season: number;
  status: 'ACTIVE' | 'ERROR';
}

interface TelemetryLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

interface StateScoutTelemetry {
  status: 'ONLINE' | 'STANDBY' | 'ERROR';
  lastRunTimestamp: string | null;
  lastScheduleReconciledCount: number;
  lastResultsReconciledCount: number;
  totalDatesCorrected: number;
  totalResultsSettled: number;
  totalSumulasParsed?: number;
  lastMatchdayLiveTimestamp?: string | null;
  activeLiveMatchesCount?: number;
  activeDrivers: TelemetryDriver[];
  recentLogs: TelemetryLog[];
}

export type PhotoSyncFrequency = '30m' | '1h' | '2x_day' | '1x_day';

interface PhotoAgentConfig {
  frequency: PhotoSyncFrequency;
  lastRunTimestamp: string | null;
  nextRunEstimated: string | null;
  isRunning: boolean;
}

export default function StateScoutAgentDashboardPage() {
  const [telemetry, setTelemetry] = useState<StateScoutTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [photoConfig, setPhotoConfig] = useState<PhotoAgentConfig | null>(null);
  const [updatingFrequency, setUpdatingFrequency] = useState(false);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/state-scout/status`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err: any) {
      console.error("Falha ao buscar telemetria do State Scout:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/state-scout/player-photos/config`);
      if (res.ok) {
        const data = await res.json();
        setPhotoConfig(data);
      }
    } catch (err: any) {
      console.error("Falha ao buscar config do agente de fotos:", err);
    }
  };

  const handleFrequencyChange = async (frequency: PhotoSyncFrequency) => {
    try {
      setUpdatingFrequency(true);
      const res = await fetch(`${API_URL}/state-scout/player-photos/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frequency }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotoConfig(updated);
        const labels: Record<PhotoSyncFrequency, string> = {
          '30m': '30 minutos',
          '1h': '1 hora',
          '2x_day': '2 vezes ao dia',
          '1x_day': '1 vez ao dia',
        };
        setNotification({
          type: 'success',
          message: `Frequência de fotos OGol configurada para: ${labels[frequency]} com sucesso!`,
        });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Erro ao alterar frequência de fotos: ${err.message}`,
      });
    } finally {
      setUpdatingFrequency(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchPhotoConfig();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchPhotoConfig();
    }, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const triggerAction = async (endpoint: string, actionName: string) => {
    try {
      setActionLoading(actionName);
      setNotification(null);
      const res = await fetch(`${API_URL}/state-scout/${endpoint}`, {
        method: 'POST',
      });
      if (res.ok) {
        const result = await res.json();
        let message = `Ação "${actionName}" executada com sucesso!`;
        if (result.syncedMatches !== undefined) {
          message = `Escalações OGol: ${result.syncedMatches} partidas e ${result.updatedLineupsCount || 0} titulares processados.`;
        } else if (result.updatedScorers !== undefined || result.updatedLineups !== undefined) {
          message = `Fotos OGol: ${result.updatedScorers || 0} artilheiros e ${result.updatedLineups || 0} escalações atualizadas.`;
        } else if (result.updatedScheduleCount !== undefined || result.settledResultsCount !== undefined) {
          message = `Ação "${actionName}" executada com sucesso! ${result.updatedScheduleCount || 0} datas e ${result.settledResultsCount || 0} placares processados.`;
        }
        setNotification({
          type: 'success',
          message,
        });
        await fetchTelemetry();
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Erro ao executar "${actionName}": ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 p-6 lg:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link 
                href="/adminpanel/agents"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  State League Scout
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                    100% Autônomo
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Monitor Autônomo de Calendário, Federações Estaduais & Placares Finais (FT)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => triggerAction('reconcile/past-games', 'Reconciliar Jogos Passados')}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30"
              title="Varre todas as partidas já disputadas da temporada, baixa súmulas oficiais, popula escalações e artilharia"
            >
              {actionLoading === 'Reconciliar Jogos Passados' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
              Reconciliar Jogos Passados
            </button>
            <button
              onClick={() => triggerAction('reconcile/live', 'Matchday Live 60s')}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors shadow-lg shadow-amber-900/30"
              title="Dispara a varredura ao vivo da rodada para detectar gols e atualizar placares em tempo real"
            >
              {actionLoading === 'Matchday Live 60s' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              Matchday Live 60s
            </button>
            <button
              onClick={() => triggerAction('sync/player-photos', 'Buscar Fotos OGol')}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shadow-lg shadow-purple-900/30"
              title="Varre atletas sem foto na artilharia/escalação e busca no OGol com cache permanente"
            >
              {actionLoading === 'Buscar Fotos OGol' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              Buscar Fotos OGol
            </button>
            <button
              onClick={() => triggerAction('sync/ogol-lineups', 'Escalações OGol')}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-lg shadow-teal-900/30"
              title="Varre jogos de estaduais sem escalação e extrai os Últimos Titulares no OGol"
            >
              {actionLoading === 'Escalações OGol' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              Escalações OGol
            </button>
            <button
              onClick={() => triggerAction('reconcile', 'Conciliação Completa')}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-900/30"
            >
              {actionLoading === 'Conciliação Completa' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Conciliação Completa
            </button>
          </div>
        </div>

        {/* Notificação */}
        {notification && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        {/* Metricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Status do Agente</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.status || 'ONLINE'}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Último ciclo: {telemetry?.lastRunTimestamp ? new Date(telemetry.lastRunTimestamp).toLocaleTimeString('pt-BR') : 'Aguardando'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Datas / Locais</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.totalDatesCorrected || 0}
            </div>
            <div className="text-xs text-slate-500">
              Alinhados com federação
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Placares FT</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.totalResultsSettled || 0}
            </div>
            <div className="text-xs text-slate-500">
              Standings recalculados
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Súmulas Lidas</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.totalSumulasParsed || 0}
            </div>
            <div className="text-xs text-slate-500">
              Escalações & Gols CBF/FPF
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Matchday Live</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.activeLiveMatchesCount ? `${telemetry.activeLiveMatchesCount} jogos` : 'Em espera'}
            </div>
            <div className="text-xs text-slate-500">
              {telemetry?.activeLiveMatchesCount ? 'Varredura 60s ativa' : '0% CPU fora de jogos'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Trava Não-Regressiva</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              100% Blindado
            </div>
            <div className="text-xs text-slate-500">
              APIs externas não revertem FT
            </div>
          </div>
        </div>

        {/* Controle de Frequência - Agente de Fotos OGol */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  Controle de Frequência • Busca de Fotos OGol
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                    Ativo: {photoConfig?.frequency === '30m' ? '30 m' : photoConfig?.frequency === '1h' ? '1 h' : photoConfig?.frequency === '2x_day' ? '2x dia' : '1 vez dia'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Periodicidade da varredura autônoma para download e enriquecimento de fotos de atletas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>
                Próxima execução: <strong className="text-slate-200">{photoConfig?.nextRunEstimated ? new Date(photoConfig.nextRunEstimated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Aguardando'}</strong>
              </span>
            </div>
          </div>

          {/* Opções de Frequência solicitadas: 30 m, 1 h, 2x dia, 1 vez dia */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { id: '30m' as PhotoSyncFrequency, label: '30 m', desc: 'A cada 30 minutos' },
              { id: '1h' as PhotoSyncFrequency, label: '1 h', desc: 'A cada 1 hora' },
              { id: '2x_day' as PhotoSyncFrequency, label: '2x dia', desc: 'A cada 12 horas' },
              { id: '1x_day' as PhotoSyncFrequency, label: '1 vez dia', desc: 'A cada 24 horas' },
            ].map((option) => {
              const isSelected = (photoConfig?.frequency || '1x_day') === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleFrequencyChange(option.id)}
                  disabled={updatingFrequency || actionLoading !== null}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drivers Ativos & Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card dos Drivers */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Drivers Registrados
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {telemetry?.activeDrivers.length || 1} Ativo(s)
              </span>
            </div>

            <div className="space-y-3">
              {(telemetry?.activeDrivers && telemetry.activeDrivers.length > 0) ? (
                telemetry.activeDrivers.map((driver) => (
                  <div key={driver.leagueExternalId} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-sm">{driver.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        {driver.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Liga ID (API):</span>
                        <span className="text-slate-300 font-mono">#{driver.leagueExternalId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Temporada:</span>
                        <span className="text-slate-300 font-mono">{driver.season}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frequência:</span>
                        <span className="text-emerald-400 font-mono">6h, 14h / 15m</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">FPF (Pernambucano)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                      ATIVO
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Liga ID (API):</span>
                      <span className="text-slate-300 font-mono">#622</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temporada:</span>
                      <span className="text-slate-300 font-mono">2027</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pluggable Drivers Ready */}
              <div className="p-3 rounded-xl border border-dashed border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
                <span>FCF (Cearense) & FGF (Gaúcho)</span>
                <span className="text-slate-600 font-mono">Pluggable</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Disparos Pontuais</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerAction('reconcile/schedule', 'Alinhar Calendário')}
                  disabled={actionLoading !== null}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-xs font-medium text-slate-200 transition-colors"
                >
                  Alinhar Datas
                </button>
                <button
                  onClick={() => triggerAction('reconcile/results', 'Verificar Placares')}
                  disabled={actionLoading !== null}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-xs font-medium text-slate-200 transition-colors"
                >
                  Checar Placares
                </button>
              </div>
            </div>
          </div>

          {/* Feed de Logs em Tempo Real */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Feed de Auditoria & Execuções Recentes
              </h2>
              <span className="text-xs text-slate-500">
                Auto-refresh ativo
              </span>
            </div>

            <div className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 font-mono text-xs overflow-y-auto max-h-[360px] space-y-2">
              {telemetry?.recentLogs && telemetry.recentLogs.length > 0 ? (
                telemetry.recentLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 border-b border-slate-900/80 pb-2 last:border-b-0 last:pb-0">
                    <span className="text-slate-500 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                      log.level === 'INFO'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : log.level === 'WARN'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 break-words leading-relaxed">
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Nenhum evento registrado ainda. O agente está online e em prontidão.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
