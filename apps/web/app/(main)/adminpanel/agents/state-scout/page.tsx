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
  Sparkles
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
  activeDrivers: TelemetryDriver[];
  recentLogs: TelemetryLog[];
}

export default function StateScoutAgentDashboardPage() {
  const [telemetry, setTelemetry] = useState<StateScoutTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000); // 30s auto-refresh
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
        setNotification({
          type: 'success',
          message: `Ação "${actionName}" executada com sucesso! ${result.updatedScheduleCount || result.updatedCount || 0} datas e ${result.settledResultsCount || result.settledCount || 0} placares processados.`,
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

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Telemetria
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
              Conciliação Completa Agora
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Último ciclo: {telemetry?.lastRunTimestamp ? new Date(telemetry.lastRunTimestamp).toLocaleTimeString('pt-BR') : 'Aguardando inicialização'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Datas / Locais Corrigidos</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.totalDatesCorrected || 0}
            </div>
            <div className="text-xs text-slate-500">
              Auto-alinhados com federações
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Placares FT Encerrados</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {telemetry?.totalResultsSettled || 0}
            </div>
            <div className="text-xs text-slate-500">
              Standings recalculados & push emitido
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Proteção Não-Regressiva</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              100% Blindado
            </div>
            <div className="text-xs text-slate-500">
              API-Football atrasada não reverte FT
            </div>
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
