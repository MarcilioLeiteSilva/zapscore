"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Newspaper, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  ArrowRight,
  Search,
  Filter,
  Check,
  Globe,
  SlidersHorizontal,
  ShieldAlert
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://zapscore-zapscore-api.gtalg3.easypanel.host";

interface FlaggedItem {
  id: string;
  title: string;
  source: string | null;
  currentLeagueId: string | null;
  currentLeagueName: string;
  suggestedLeagueExternalId: number | null;
  suggestedLeagueName: string;
  violationType: 'ITALIAN_IN_BRAZIL' | 'BRAZIL_IN_ITALY' | 'SERIE_B_IN_SERIE_A' | 'CROSS_LEAGUE_MISMATCH' | 'NON_COMPLIANT_IRRELEVANT' | 'GENERIC_MISMATCH';
  severity: 'HIGH' | 'MEDIUM';
  detectedTokens: string[];
  createdAt: string;
}

interface LeagueHealth {
  id: string;
  externalId: number;
  name: string;
  country: string | null;
  totalNews: number;
  contaminatedNews: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

interface AuditData {
  summary: {
    totalNews: number;
    totalAudited: number;
    contaminatedCount: number;
    nonCompliantCount: number;
    healthyCount: number;
    complianceRate: number;
    lastAuditTimestamp: string;
  };
  leagues: LeagueHealth[];
  flaggedItems: FlaggedItem[];
}

export default function ContentScoutDashboardPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [healing, setHealing] = useState(false);
  const [activeTab, setActiveTab] = useState<'flagged' | 'leagues'>('flagged');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('');

  const fetchAudit = async (leagueExtId?: string) => {
    try {
      setLoading(true);
      const queryParam = leagueExtId ? `?leagueId=${leagueExtId}` : '';
      const res = await fetch(`${API_URL}/content-scout/audit${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      } else {
        showNotification('error', 'Falha ao carregar auditoria do Content Scout');
      }
    } catch (err: any) {
      showNotification('error', `Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(selectedLeagueFilter);
  }, [selectedLeagueFilter]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleSanitizeAndHeal = async (purge: boolean = true) => {
    try {
      setHealing(true);
      const res = await fetch(`${API_URL}/content-scout/sanitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purgeNonCompliant: purge,
          leagueExternalId: selectedLeagueFilter ? Number(selectedLeagueFilter) : undefined,
          maxItems: 2000,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        const parts: string[] = [];
        if (result.reclassifiedCount > 0) parts.push(`${result.reclassifiedCount} reclassificadas`);
        if (result.purgedCount > 0) parts.push(`${result.purgedCount} expurgadas`);
        const summaryText = parts.length > 0 ? parts.join(' e ') : '0 alterações necessárias (base limpa)';
        showNotification('success', `Sanitização concluída com sucesso: ${summaryText}.`);
        await fetchAudit(selectedLeagueFilter);
      } else {
        showNotification('error', 'Erro ao executar sanitização e expurgo.');
      }
    } catch (err: any) {
      showNotification('error', `Erro na execução do Content Scout: ${err.message}`);
    } finally {
      setHealing(false);
    }
  };

  const handleReassign = async (newsId: string, targetLeagueId: string | null) => {
    try {
      const res = await fetch(`${API_URL}/content-scout/reassign/${newsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLeagueId }),
      });
      if (res.ok) {
        showNotification('success', 'Liga da notícia reatribuída com sucesso!');
        await fetchAudit(selectedLeagueFilter);
      } else {
        showNotification('error', 'Falha ao reatribuir liga.');
      }
    } catch (err: any) {
      showNotification('error', `Erro: ${err.message}`);
    }
  };

  const handleRemoveNews = async (newsId: string) => {
    if (!confirm('Deseja realmente expurgar esta notícia do banco de dados?')) return;
    try {
      const res = await fetch(`${API_URL}/content-scout/news/${newsId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('success', 'Notícia não conforme expurgada com sucesso.');
        await fetchAudit(selectedLeagueFilter);
      } else {
        showNotification('error', 'Falha ao excluir notícia.');
      }
    } catch (err: any) {
      showNotification('error', `Erro: ${err.message}`);
    }
  };

  // Filtragem dos itens com alerta
  const filteredFlagged = auditData?.flaggedItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.source && item.source.toLowerCase().includes(term)) ||
      item.currentLeagueName.toLowerCase().includes(term) ||
      item.suggestedLeagueName.toLowerCase().includes(term) ||
      item.detectedTokens.some(t => t.toLowerCase().includes(term))
    );
  }) || [];

  const getFlag = (country?: string | null, extId?: number) => {
    const c = (country || '').toLowerCase();
    if (c.includes('brazil') || c.includes('brasil') || extId === 71 || extId === 72) return '🇧🇷';
    if (c.includes('italy') || c.includes('itália') || extId === 135) return '🇮🇹';
    if (c.includes('england') || c.includes('inglaterra') || extId === 39) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    if (c.includes('spain') || c.includes('espanha') || extId === 140) return '🇪🇸';
    if (c.includes('germany') || c.includes('alemanha') || extId === 78) return '🇩🇪';
    if (c.includes('france') || c.includes('frança') || extId === 61) return '🇫🇷';
    return '🌐';
  };

  const renderViolationBadge = (type: FlaggedItem['violationType']) => {
    switch (type) {
      case 'ITALIAN_IN_BRAZIL':
        return <span className="badge badge-warning text-[10px]">🇮🇹 Calcio no Brasileirão</span>;
      case 'BRAZIL_IN_ITALY':
        return <span className="badge badge-warning text-[10px]">🇧🇷 Brasil na Itália</span>;
      case 'SERIE_B_IN_SERIE_A':
        return <span className="badge badge-warning text-[10px]">🇧🇷 Série B na Série A</span>;
      case 'CROSS_LEAGUE_MISMATCH':
        return <span className="badge badge-warning text-[10px]">🔄 Contaminação Cruzada</span>;
      case 'NON_COMPLIANT_IRRELEVANT':
        return <span className="badge badge-danger text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">🚫 Não Conforme / Expurgo</span>;
      default:
        return <span className="badge badge-secondary text-[10px]">⚠️ Incompatibilidade</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 transition-all transform animate-in slide-in-from-top duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertTriangle size={20} className="text-rose-400" />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <Link
            href="/adminpanel/agents"
            className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-live">• ONLINE • AUTO-HEAL 30M</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">GUARDIÃO DE CONTEÚDO & SANITIZAÇÃO</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Newspaper className="text-blue-400" size={28} />
              Content <span style={{ color: 'var(--primary)' }}>Scout</span>
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* League Filter */}
          <div className="flex items-center gap-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-[var(--text-muted)]" />
            <select
              value={selectedLeagueFilter}
              onChange={(e) => setSelectedLeagueFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="" className="bg-[var(--surface)] text-white">Todas as Ligas</option>
              {auditData?.leagues.map((l) => (
                <option key={l.id} value={l.externalId} className="bg-[var(--surface)] text-white">
                  {l.name} (#{l.externalId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchAudit(selectedLeagueFilter)}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar Auditoria</span>
          </button>

          <button
            onClick={() => handleSanitizeAndHeal(true)}
            disabled={healing}
            className="btn btn-primary flex items-center gap-2 text-xs py-2.5 px-5 shadow-lg shadow-blue-500/10 font-bold"
          >
            {healing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Sanitizando Base...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Executar Sanitização & Expurgo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Taxa de Integridade Semântica */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Integridade Semântica</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {auditData ? `${auditData.summary.complianceRate}%` : '---'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {auditData ? `${auditData.summary.healthyCount} matérias conformes` : 'Carregando métricas...'}
          </p>
          <div className="w-full bg-[var(--surface-hover)] h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${auditData?.summary.complianceRate || 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Contaminações Cruzadas */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contaminações Cruzadas</span>
            <AlertTriangle size={18} className={auditData?.summary.contaminatedCount ? 'text-amber-400' : 'text-emerald-400'} />
          </div>
          <div className={`text-3xl font-black font-mono ${auditData?.summary.contaminatedCount ? 'text-amber-400' : 'text-emerald-400'}`}>
            {auditData ? auditData.summary.contaminatedCount : '---'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {auditData?.summary.contaminatedCount 
              ? 'Matérias em ligas homônimas ou incorretas' 
              : 'Zero contaminação ativa na base'}
          </p>
        </div>

        {/* Card 3: Não Conformes / Expurgo */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Não Conformes / Expurgo</span>
            <ShieldAlert size={18} className={auditData?.summary.nonCompliantCount ? 'text-rose-400' : 'text-emerald-400'} />
          </div>
          <div className={`text-3xl font-black font-mono ${auditData?.summary.nonCompliantCount ? 'text-rose-400' : 'text-emerald-400'}`}>
            {auditData ? auditData.summary.nonCompliantCount : '---'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {auditData?.summary.nonCompliantCount 
              ? 'Matérias irrelevantes, spam ou fora de contexto' 
              : 'Nenhum lixo ou spam detectado'}
          </p>
        </div>

        {/* Card 4: Volume Total Auditado */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Amostra Auditada</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">DB POSTGRES</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {auditData?.summary.totalAudited || 0}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            de {auditData?.summary.totalNews || 0} notícias totais registradas
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'flagged'
              ? 'bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/20'
              : 'text-[var(--text-muted)] hover:text-white bg-[var(--surface-hover)]'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Matérias para Sanitização ({auditData?.flaggedItems.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('leagues')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'leagues'
              ? 'bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/20'
              : 'text-[var(--text-muted)] hover:text-white bg-[var(--surface-hover)]'
          }`}
        >
          <Globe size={15} />
          <span>Saúde por Competição ({auditData?.leagues.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: FLAGGED ITEMS */}
      {activeTab === 'flagged' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Casos de Não Conformidade & Contaminação</h2>
              <p className="text-xs text-[var(--text-muted)]">
                O Content Scout identifica notícias contaminadas (para reclassificação) e notícias irrelevantes/spam (para expurgo).
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Filtrar por título, fonte ou termo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 text-xs w-full"
              />
            </div>
          </div>

          {filteredFlagged.length === 0 ? (
            <div className="card p-12 text-center border border-[var(--border)]">
              <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">Base Totalmente Sanitizada</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mt-1">
                Todas as notícias auditadas estão perfeitamente alinhadas com suas respectivas competições. Zero contaminação ou conteúdo não conforme pendente.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden border border-[var(--border)]">
              <div className="overflow-x-auto">
                <table className="table w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-hover)]">
                      <th className="py-3 px-4">Notícia / Manchete</th>
                      <th className="py-3 px-4">Fonte</th>
                      <th className="py-3 px-4">Diagnóstico</th>
                      <th className="py-3 px-4">Liga Atual</th>
                      <th className="py-3 px-4">Destino / Sugestão</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4 text-right">Ação Cirúrgica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlagged.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-white truncate" title={item.title}>
                            {item.title}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-[var(--text-muted)]">
                            {item.source || 'RSS Feed'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {renderViolationBadge(item.violationType)}
                        </td>

                        <td className="py-3 px-4">
                          <span className="badge badge-warning text-[10px]">
                            {item.currentLeagueName}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {item.suggestedLeagueExternalId ? (
                            <span className="badge badge-live text-[10px] flex items-center gap-1 w-fit">
                              <ArrowRight size={11} /> {item.suggestedLeagueName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                              <Trash2 size={11} /> Expurgo Obrigatório
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.detectedTokens.map((tok, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[9px] font-mono">
                                {tok}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.suggestedLeagueExternalId ? (
                              <button
                                onClick={() => {
                                  const targetLeague = auditData?.leagues.find(l => l.externalId === item.suggestedLeagueExternalId);
                                  if (targetLeague) {
                                    handleReassign(item.id, targetLeague.id);
                                  }
                                }}
                                className="btn btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 hover:bg-emerald-500/20 hover:text-emerald-300"
                                title="Mover para a liga correta sugerida"
                              >
                                <Sparkles size={12} />
                                <span>Transferir</span>
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleRemoveNews(item.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-[11px] px-2.5 font-semibold"
                              title="Expurgar do banco de dados"
                            >
                              <Trash2 size={13} />
                              <span>Expurgar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEAGUES OVERVIEW */}
      {activeTab === 'leagues' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Mapa de Saúde das Notícias por Competição</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Auditoria em tempo real de matérias distribuídas no banco de dados para cada módulo de competição.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditData?.leagues.map((league) => (
              <div key={league.id} className="card p-5 border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-white text-sm truncate flex items-center gap-2">
                      <span className="text-base">{getFlag(league.country, league.externalId)}</span>
                      <span>{league.name}</span>
                      <span className="text-[11px] text-[var(--text-muted)] font-normal">({league.country || 'Geral'})</span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      league.contaminatedNews === 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {league.contaminatedNews === 0 ? '🟢 100% LIMPO' : `🔴 ${league.contaminatedNews} SUSPEITAS`}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mb-4">
                    <span>{league.country || 'Internacional'}</span>
                    <span>•</span>
                    <span className="font-mono">Ext ID: {league.externalId}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Volume no Feed:</span>
                  <span className="font-black text-white font-mono">{league.totalNews} matérias</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
