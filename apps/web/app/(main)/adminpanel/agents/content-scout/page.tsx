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
  ExternalLink, 
  Layers, 
  Flame, 
  Search, 
  Trash2, 
  ArrowRight,
  Filter,
  Check,
  Globe,
  SlidersHorizontal,
  Bot
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
  violationType: 'ITALIAN_IN_BRAZIL' | 'BRAZIL_IN_ITALY' | 'SERIE_B_IN_SERIE_A' | 'GENERIC_MISMATCH';
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
  const [activeTab, setActiveTab] = useState<'flagged' | 'leagues' | 'manual'>('flagged');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [selectedTargetLeague, setSelectedTargetLeague] = useState<string>('');

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/content-scout/audit`);
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
    fetchAudit();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleHealAll = async () => {
    try {
      setHealing(true);
      const res = await fetch(`${API_URL}/content-scout/heal`, {
        method: 'POST',
      });
      if (res.ok) {
        const result = await res.json();
        showNotification('success', `Faxina concluída! ${result.fixedCount} matérias foram reclassificadas e organizadas com sucesso.`);
        await fetchAudit();
      } else {
        showNotification('error', 'Erro ao executar faxina e reclassificação');
      }
    } catch (err: any) {
      showNotification('error', `Erro na execução do heal: ${err.message}`);
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
        await fetchAudit();
        setReassigningId(null);
      } else {
        showNotification('error', 'Falha ao reatribuir liga');
      }
    } catch (err: any) {
      showNotification('error', `Erro: ${err.message}`);
    }
  };

  const handleRemoveNews = async (newsId: string) => {
    if (!confirm('Deseja realmente remover esta notícia do sistema?')) return;
    try {
      const res = await fetch(`${API_URL}/content-scout/news/${newsId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('success', 'Notícia excluída com sucesso.');
        await fetchAudit();
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
      item.detectedTokens.some(t => t.toLowerCase().includes(term))
    );
  }) || [];

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
              <span className="badge badge-live">• ONLINE • CRON 30M</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">GUARDIÃO DE CONTEÚDO</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Newspaper className="text-blue-400" size={28} />
              Content <span style={{ color: 'var(--primary)' }}>Scout</span>
            </h1>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudit}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2 text-xs py-2.5 px-4"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar Auditoria</span>
          </button>

          <button
            onClick={handleHealAll}
            disabled={healing}
            className="btn btn-primary flex items-center gap-2 text-xs py-2.5 px-5 shadow-lg shadow-blue-500/10 font-bold"
          >
            {healing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Higienizando Base...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Executar Faxina e Reclassificação</span>
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
            {auditData ? `${auditData.summary.healthyCount} matérias auditadas e conformes` : 'Carregando métricas...'}
          </p>
          <div className="w-full bg-[var(--surface-hover)] h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${auditData?.summary.complianceRate || 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Contaminações Detectadas */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contaminações Cruzadas</span>
            <AlertTriangle size={18} className={auditData?.summary.contaminatedCount ? 'text-rose-400' : 'text-emerald-400'} />
          </div>
          <div className={`text-3xl font-black font-mono ${auditData?.summary.contaminatedCount ? 'text-rose-400' : 'text-emerald-400'}`}>
            {auditData ? auditData.summary.contaminatedCount : '---'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {auditData?.summary.contaminatedCount 
              ? 'Detectadas fora de contexto (ex: Itália no BR)' 
              : 'Zero contaminação ativa na base'}
          </p>
        </div>

        {/* Card 3: Brasileirão Série A (ID 71) */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Brasileirão Série A</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">ID 71</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {auditData?.leagues.find(l => l.externalId === 71)?.totalNews || 0}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <Check size={13} /> Filtro defensivo ativo no endpoint
          </p>
        </div>

        {/* Card 4: Serie A Italiana (ID 135) */}
        <div className="card p-5 relative overflow-hidden border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Serie A Italiana</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ID 135</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {auditData?.leagues.find(l => l.externalId === 135)?.totalNews || 0}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Notícias do Calcio isoladas de forma estrita
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
          <span>Matérias Suspeitas / Alertas ({auditData?.flaggedItems.length || 0})</span>
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
              <h2 className="text-lg font-bold text-white">Casos de Contaminação Identificados pelo Agente</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Matérias associadas a ligas incorretas devido a homonímia textual ("Serie A") ou ruídos nos feeds RSS.
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
              <h3 className="text-base font-bold text-white">Nenhuma Contaminação Pendente</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mt-1">
                Todas as notícias auditadas estão perfeitamente alinhadas com suas respectivas competições. O Brasileirão Série A está 100% livre de matérias italianas.
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
                      <th className="py-3 px-4">Liga Atual</th>
                      <th className="py-3 px-4">Destino Correto</th>
                      <th className="py-3 px-4">Tokens Detectados</th>
                      <th className="py-3 px-4 text-right">Ação Corretiva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlagged.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-3 px-4 max-w-sm">
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
                          <span className="badge badge-warning text-[10px]">
                            {item.currentLeagueName}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="badge badge-live text-[10px] flex items-center gap-1 w-fit">
                            <ArrowRight size={11} /> {item.suggestedLeagueName}
                          </span>
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

                            <button
                              onClick={() => handleRemoveNews(item.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Remover notícia do banco"
                            >
                              <Trash2 size={13} />
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
                    <span className="font-bold text-white text-sm truncate">{league.name}</span>
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
