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
  AlertCircle,
  X,
  Users
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
  source?: 'official' | 'calculated';
}

export default function ScorerAgentDashboardPage() {
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [leaguesStatus, setLeaguesStatus] = useState<LeagueScorerStatus[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingLeagueId, setSyncingLeagueId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedLeagueForDetails, setSelectedLeagueForDetails] = useState<LeagueScorerStatus | null>(null);
  const [athletesList, setAthletesList] = useState<any[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  const fetchAthletesForLeague = async (leagueId: number) => {
    setLoadingAthletes(true);
    try {
      const res = await fetch(`${API_URL}/competitions/${leagueId}/scorers?season=2026`);
      if (res.ok) {
        const data = await res.json();
        setAthletesList(Array.isArray(data) ? data : []);
      } else {
        setAthletesList([]);
      }
    } catch {
      setAthletesList([]);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const handleOpenDrawer = (league: LeagueScorerStatus) => {
    setSelectedLeagueForDetails(league);
    fetchAthletesForLeague(league.id);
  };

  const handleCloseDrawer = () => {
    setSelectedLeagueForDetails(null);
    setAthletesList([]);
  };

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
          let source: 'official' | 'calculated' | undefined = undefined;

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              count = data.length;
              topScorer = data[0].playerName || data[0].player?.name;
              topScorerGoals = data[0].goals;
              // Se possuir externalPlayerId ou foto oficial da api-sports, foi oficial
              source = data[0].externalPlayerId || data[0].playerPhoto?.includes('api-sports.io')
                ? 'official'
                : 'calculated';
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
            source,
            lastSync: count > 0 
              ? (source === 'official' ? 'Oficial (API)' : 'Calculado (Eventos)') 
              : 'Sem registros',
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
        const isOfficial = data.source === 'official';
        // Atualiza estado local daquela liga
        setLeaguesStatus((prev) =>
          prev.map((item) => {
            if (item.id === leagueId) {
              return {
                ...item,
                scorersCount: data.topScorersCount || item.scorersCount,
                source: data.source,
                lastSync: isOfficial ? 'Oficial (API)' : 'Calculado (Eventos)',
              };
            }
            return item;
          })
        );
        showToast(
          'success', 
          isOfficial 
            ? `Artilharia oficial sincronizada via API-Football (${data.topScorersCount || 0} artilheiros)!`
            : `Artilharia consolidada via eventos locais (${data.totalGoalsFound || 0} gols calculados)!`
        );

        if (selectedLeagueForDetails && selectedLeagueForDetails.id === leagueId) {
          fetchAthletesForLeague(leagueId);
        }
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
          <div className="text-2xl font-black text-white mt-3">1x ao dia</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">00:30 BRT (Madrugada) • Cota protegida</p>
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

                      {/* Status / Origem */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          league.scorersCount === 0
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : league.source === 'official' || league.lastSync?.includes('Oficial')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            league.scorersCount === 0
                              ? 'bg-slate-500'
                              : league.source === 'official' || league.lastSync?.includes('Oficial')
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}></span>
                          {league.scorersCount === 0
                            ? 'Sem registros'
                            : league.source === 'official' || league.lastSync?.includes('Oficial')
                            ? '🟢 Oficial (API)'
                            : '🟡 Calculado (Eventos)'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDrawer(league)}
                            className="p-2 bg-[var(--surface)] hover:bg-[var(--border)] text-amber-400 hover:text-amber-300 rounded-xl border border-[var(--border)] transition-colors flex items-center gap-1.5 px-3 font-bold text-xs"
                            title="Auditar atletas e gols desta competição"
                          >
                            <Users size={14} />
                            <span className="hidden sm:inline">Auditar</span>
                          </button>

                          <button
                            onClick={() => handleSyncSingleLeague(league.id)}
                            disabled={isSyncingThis || syncingAll}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            title="Reconciliar artilharia desta liga agora"
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

      {/* Gaveta Lateral de Auditoria de Atletas (Slide-over Drawer) */}
      {selectedLeagueForDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-[var(--surface)] border-l border-[var(--border)] h-full overflow-y-auto p-6 flex flex-col shadow-2xl">
            {/* Header da Gaveta */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedLeagueForDetails.flag}</span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedLeagueForDetails.name}
                    <span className="badge badge-live text-[10px]">Temporada 2026</span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Auditoria de Artilharia Factual • {athletesList.length} Atletas
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)] rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ações da Gaveta */}
            <div className="flex items-center justify-between my-4 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
              <div>
                <span className="text-xs font-bold text-white block">Status da Reconciliação</span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  🛡️ Monotonicidade Ativa (Sem perda de gols)
                </span>
              </div>
              <button
                onClick={() => handleSyncSingleLeague(selectedLeagueForDetails.id)}
                disabled={syncingLeagueId === selectedLeagueForDetails.id}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {syncingLeagueId === selectedLeagueForDetails.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>Reconciliar Agora</span>
              </button>
            </div>

            {/* Lista de Atletas */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingAthletes ? (
                <div className="py-16 text-center text-[var(--text-muted)]">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Carregando artilheiros auditados...
                </div>
              ) : athletesList.length === 0 ? (
                <div className="py-16 text-center text-[var(--text-muted)]">
                  Nenhum artilheiro cadastrado nesta liga ainda.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
                  {athletesList.map((athlete: any, idx: number) => {
                    const rank = athlete.rank || idx + 1;
                    return (
                      <div
                        key={athlete.id || idx}
                        className="p-3.5 flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors bg-[var(--surface)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            rank === 1
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                              : rank === 2
                              ? 'bg-slate-300 text-black'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-white/5 text-[var(--text-muted)]'
                          }`}>
                            {rank}º
                          </span>

                          {athlete.playerPhoto ? (
                            <img
                              src={athlete.playerPhoto}
                              alt={athlete.playerName}
                              className="w-9 h-9 rounded-full object-cover border border-[var(--border)] shrink-0 bg-slate-800"
                              onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-[var(--border)] flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                              {athlete.playerName ? athlete.playerName[0] : '?'}
                            </div>
                          )}

                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{athlete.playerName}</span>
                              {athlete.externalPlayerId && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ID: {athlete.externalPlayerId}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                              {athlete.teamLogo && (
                                <img
                                  src={athlete.teamLogo}
                                  alt={athlete.teamName}
                                  className="w-3.5 h-3.5 object-contain"
                                  onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <span>{athlete.teamName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="font-mono font-black text-amber-400 text-sm">
                              {athlete.goals} <span className="text-[10px] font-normal text-[var(--text-muted)]">gols</span>
                            </div>
                            {athlete.assists > 0 && (
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                {athlete.assists} assist.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer da Gaveta */}
            <div className="pt-4 border-t border-[var(--border)] mt-4 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>ZapScore Scorer Engine v2.0</span>
              <button
                onClick={handleCloseDrawer}
                className="px-4 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white rounded-xl font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
