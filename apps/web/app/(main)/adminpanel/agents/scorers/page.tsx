"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Activity, 
  Layers, 
  Flame, 
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ECOSYSTEM_MODULES, LeagueConfig } from '../../registry';

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

interface LeagueScorerStatus {
  id: number;
  name: string;
  country: string;
  flag: string;
  moduleName: string;
  moduleHref: string;
  scorersCount: number;
  topScorer?: string;
  topScorerGoals?: number;
  lastSync?: string;
  loading?: boolean;
}

export default function ScorerAgentDashboardPage() {
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [leaguesStatus, setLeaguesStatus] = useState<LeagueScorerStatus[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingLeagueId, setSyncingLeagueId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Monta lista de todas as ligas do ecossistema
  const allLeagues: { league: LeagueConfig; moduleName: string; moduleHref: string }[] = [];
  ECOSYSTEM_MODULES.forEach((mod) => {
    mod.leagues.forEach((l) => {
      allLeagues.push({
        league: l,
        moduleName: mod.shortName,
        moduleHref: `${mod.href}/${l.id}`,
      });
    });
  });

  const loadAllScorersStatus = async () => {
    try {
      setLoadingInitial(true);
      const results: LeagueScorerStatus[] = [];

      // Consulta os scorers de cada liga em paralelo (com limite controlado)
      const promises = allLeagues.map(async (item) => {
        try {
          const res = await fetch(`${API_URL}/competitions/${item.league.id}/scorers?season=2026`);
          let count = 0;
          let topScorer = undefined;
          let topScorerGoals = undefined;

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              count = data.length;
              topScorer = data[0].playerName || data[0].player?.name;
              topScorerGoals = data[0].goals;
            }
          }

          return {
            id: item.league.id,
            name: item.league.name,
            country: item.league.country,
            flag: item.league.flag,
            moduleName: item.moduleName,
            moduleHref: item.moduleHref,
            scorersCount: count,
            topScorer,
            topScorerGoals,
            lastSync: count > 0 ? 'Consolidado' : 'Sem registros',
          };
        } catch {
          return {
            id: item.league.id,
            name: item.league.name,
            country: item.league.country,
            flag: item.league.flag,
            moduleName: item.moduleName,
            moduleHref: item.moduleHref,
            scorersCount: 0,
            lastSync: 'Erro ao consultar',
          };
        }
      });

      const loaded = await Promise.all(promises);
      setLeaguesStatus(loaded);
    } catch (err) {
      console.error('Erro ao carregar status das ligas:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadAllScorersStatus();
  }, []);

  const handleSyncSingleLeague = async (leagueId: number) => {
    try {
      setSyncingLeagueId(leagueId);
      const res = await fetch(`${API_URL}/competitions/${leagueId}/scorers/auto-sync?season=2026`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        // Atualiza estado local daquela liga
        setLeaguesStatus((prev) =>
          prev.map((item) => {
            if (item.id === leagueId) {
              return {
                ...item,
                scorersCount: data.topScorersCount || item.scorersCount,
                lastSync: 'Atualizado agora',
              };
            }
            return item;
          })
        );
        showToast('success', `Artilharia atualizada! ${data.totalGoalsFound || 0} gols calculados.`);
      } else {
        showToast('error', 'Falha ao sincronizar artilharia da liga.');
      }
    } catch (e) {
      showToast('error', 'Erro de conexão ao sincronizar liga.');
    } finally {
      setSyncingLeagueId(null);
    }
  };

  const handleSyncAllLeagues = async () => {
    try {
      setSyncingAll(true);
      const res = await fetch(`${API_URL}/competitions/scorers/auto-sync-all?season=2026`, {
        method: 'POST',
      });

      if (res.ok) {
        showToast('success', 'Varredura geral de artilharia concluída com sucesso!');
        await loadAllScorersStatus();
      } else {
        showToast('error', 'Erro durante a sincronização em lote de todas as ligas.');
      }
    } catch (e) {
      showToast('error', 'Erro de conexão ao sincronizar todas as ligas.');
    } finally {
      setSyncingAll(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredLeagues = selectedModule === 'all' 
    ? leaguesStatus 
    : leaguesStatus.filter((l) => l.moduleName.toLowerCase() === selectedModule.toLowerCase());

  const totalActiveScorers = leaguesStatus.reduce((acc, l) => acc + l.scorersCount, 0);
  const activeLeaguesCount = leaguesStatus.filter((l) => l.scorersCount > 0).length;

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-bold animate-bounce ${
          notification.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' 
            : 'bg-red-950 border-red-500/40 text-red-300'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <Link 
          href="/adminpanel/agents"
          className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Central de Agentes</span>
        </Link>
        <span className="badge badge-live">• AGENTE DE ARTILHARIA ATIVO</span>
      </div>

      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Scorer <span style={{ color: 'var(--primary)' }}>Engine</span>
              </h1>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Auditoria & Sincronização de Artilharia Multi-Competições
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl mt-2">
            Supervisão e consolidação contínua de marcadores de gols de todas as ligas (Europa, Brasil, Estaduais e Copas).
          </p>
        </div>

        {/* Botões de Ação Global */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={loadAllScorersStatus}
            disabled={loadingInitial || syncingAll}
            className="p-3.5 bg-[var(--surface)] hover:bg-[var(--border)] text-white rounded-2xl border border-[var(--border)] transition-all"
            title="Recarregar Status"
          >
            <RefreshCw size={18} className={loadingInitial ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleSyncAllLeagues}
            disabled={syncingAll || loadingInitial}
            className="flex-1 lg:flex-none bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-black px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 tracking-wider uppercase"
          >
            {syncingAll ? (
              <Loader2 size={18} className="animate-spin text-black" />
            ) : (
              <Sparkles size={18} className="text-black" />
            )}
            <span>{syncingAll ? "SINCRONIZANDO TUDO..." : "SINCRONIZAR TODAS AS LIGAS"}</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Competições</span>
            <Layers size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-3">{allLeagues.length} Ligas</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">4 Módulos Ativos</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Ligas com Artilharia</span>
            <Trophy size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3">{activeLeaguesCount} de {allLeagues.length}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Com artilheiros consolidados</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Frequência Cron</span>
            <Clock size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-3">A cada 1 hora</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">+ Reativo em Fim de Jogo (FT)</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Integridade</span>
            <ShieldCheck size={18} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-3">100% Idempotente</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Zero duplicação de gols</p>
        </div>
      </div>

      {/* Filtro por Módulo */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-[var(--border)] pb-4">
        {['all', 'Europa', 'Brasil', 'Estaduais', 'Copas'].map((m) => (
          <button
            key={m}
            onClick={() => setSelectedModule(m)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
              selectedModule.toLowerCase() === m.toLowerCase()
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)] border border-[var(--border)]'
            }`}
          >
            {m === 'all' ? 'Todas as Ligas' : m}
          </button>
        ))}
      </div>

      {/* Tabela de Competições */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                <th className="p-4">Competição</th>
                <th className="p-4">Módulo</th>
                <th className="p-4 text-center">Artilheiros</th>
                <th className="p-4">Líder Atual</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {loadingInitial ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[var(--text-muted)]">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Carregando status das competições...
                  </td>
                </tr>
              ) : filteredLeagues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[var(--text-muted)]">
                    Nenhuma competição encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                filteredLeagues.map((league) => {
                  const isSyncingThis = syncingLeagueId === league.id;
                  return (
                    <tr key={league.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Competição */}
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-xl shrink-0">{league.flag}</span>
                          <div>
                            <div className="font-bold text-white text-sm">{league.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                              ID: {league.id} • {league.country}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Módulo */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300">
                          {league.moduleName}
                        </span>
                      </td>

                      {/* Total Artilheiros */}
                      <td className="p-4 text-center">
                        <span className={`font-mono font-bold text-sm ${league.scorersCount > 0 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                          {league.scorersCount}
                        </span>
                      </td>

                      {/* Líder Atual */}
                      <td className="p-4">
                        {league.topScorer ? (
                          <div className="flex items-center gap-2">
                            <Flame size={14} className="text-orange-400 shrink-0" />
                            <span className="font-semibold text-slate-200">{league.topScorer}</span>
                            <span className="badge badge-live text-[10px]">{league.topScorerGoals}G</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-[11px] italic">Sem artilheiro</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          league.scorersCount > 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${league.scorersCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                          {league.lastSync}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSyncSingleLeague(league.id)}
                            disabled={isSyncingThis || syncingAll}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            title="Recalcular artilharia desta liga agora"
                          >
                            {isSyncingThis ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                            <span>{isSyncingThis ? "Sincronizando..." : "Sincronizar"}</span>
                          </button>

                          <Link
                            href={league.moduleHref}
                            className="p-2 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-white rounded-xl border border-[var(--border)] transition-colors"
                            title="Ver artilharia completa no módulo da liga"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
