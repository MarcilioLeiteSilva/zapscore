'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Compass,
  Eye,
  MousePointerClick,
  Percent,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  Filter,
  RefreshCw,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

interface AdCampaign {
  id: string;
  title: string;
  advertiser: string;
  placement: string;
  target_apps: string[];
  target_leagues: number[];
  creative_image: string;
  creative_url?: string;
  destination_url: string;
  start_at: string;
  end_at: string;
  priority: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'expired';
  max_impressions: number;
  impressions_count: number;
  clicks_count: number;
  created?: string;
}

interface DashboardData {
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  activeCampaignsCount: number;
  advertisersCount: number;
  byAdvertiser: {
    advertiser: string;
    campaignsCount: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    activeCampaigns: number;
  }[];
  recentCampaigns: AdCampaign[];
}

export default function AdsDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, campRes] = await Promise.all([
        fetch(`${API_BASE}/ads/dashboard`).then((r) => r.json()),
        fetch(`${API_BASE}/ads/campaigns`).then((r) => r.json()),
      ]);

      if (dashRes.success) setDashboard(dashRes.data);
      if (campRes.success) setCampaigns(campRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados de anúncios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (campaign: AdCampaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      setActionLoading(campaign.id);
      const res = await fetch(`${API_BASE}/ads/campaigns/${campaign.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a campanha "${title}"?`)) return;

    try {
      setActionLoading(id);
      const res = await fetch(`${API_BASE}/ads/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Erro ao excluir campanha:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const placementLabels: Record<string, { name: string; isFree: boolean }> = {
    header_sponsor: { name: 'Topo da Tabela (Exclusivo)', isFree: true },
    popup_launch: { name: 'Pop-up de Boas-Vindas', isFree: true },
    native_match_card: { name: 'Card entre Jogos', isFree: true },
    banner_bottom: { name: 'Banner de Rodapé', isFree: false },
    native_news_feed: { name: 'Card em Notícias', isFree: false },
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedAdvertiser !== 'all' && (c.advertiser || 'Sem Anunciante') !== selectedAdvertiser) {
      return false;
    }
    if (selectedStatus !== 'all' && c.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const selectedAdvData = dashboard?.byAdvertiser.find((a) => a.advertiser === selectedAdvertiser);

  return (
    <div className="space-y-8 pb-16" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Top Banner & Ações Rápidas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-live text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
              • Rede Própria de Anúncios
            </span>
            <span className="badge badge-ft text-[10px] font-bold px-2.5 py-0.5">
              PocketBase HouseAds
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Megaphone className="text-amber-400 shrink-0" size={32} />
            Gestão de <span style={{ color: 'var(--primary)' }}>House Ads</span> & Patrocínios
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 max-w-2xl">
            Monetização 100% direta, fallback automático para o Google AdMob e inventário livre exclusivo por aplicativo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/adminpanel/ads/inventory"
            style={{
              background: 'var(--surface-hover)',
              borderColor: 'var(--border)',
            }}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold text-white hover:border-amber-400 transition-all flex items-center gap-2"
          >
            <Compass size={16} className="text-amber-400" />
            <span>Mapa de Inventário</span>
          </Link>

          <Link
            href="/adminpanel/ads/new"
            style={{
              background: 'var(--primary)',
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Nova Campanha</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Total de Impressões
            </p>
            <p className="text-3xl font-black text-white font-mono mt-1">
              {dashboard?.totalImpressions.toLocaleString('pt-BR') || 0}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span>● Visualizações Entregues</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Eye size={24} />
          </div>
        </div>

        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Total de Cliques
            </p>
            <p className="text-3xl font-black text-white font-mono mt-1">
              {dashboard?.totalClicks.toLocaleString('pt-BR') || 0}
            </p>
            <p className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1">
              <span>● Conversões em Links</span>
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <MousePointerClick size={24} />
          </div>
        </div>

        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              CTR Médio Global
            </p>
            <p className="text-3xl font-black text-white font-mono mt-1">
              {dashboard?.averageCtr || 0}%
            </p>
            <p className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
              <span>● Taxa de Cliques Geral</span>
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Percent size={24} />
          </div>
        </div>

        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Campanhas Ativas
            </p>
            <p className="text-3xl font-black text-white font-mono mt-1">
              {dashboard?.activeCampaignsCount || 0}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-1 flex items-center gap-1">
              <span>● {dashboard?.advertisersCount || 0} Anunciantes</span>
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* Relatório por Anunciante (Seletor de Empresa) */}
      {dashboard && dashboard.byAdvertiser.length > 0 && (
        <div className="card p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Filtro e Prestação de Contas por Empresa / Anunciante
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-[var(--text-muted)]">Selecionar Parceiro:</label>
              <select
                value={selectedAdvertiser}
                onChange={(e) => setSelectedAdvertiser(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: '#ffffff',
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todas as Empresas ({dashboard.byAdvertiser.length})</option>
                {dashboard.byAdvertiser.map((adv) => (
                  <option key={adv.advertiser} value={adv.advertiser}>
                    {adv.advertiser} ({adv.campaignsCount} campanhas)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedAdvData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[var(--border)] bg-amber-500/5 p-4 rounded-xl border-amber-500/20">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Anunciante</span>
                <p className="text-sm font-bold text-amber-400 truncate">{selectedAdvData.advertiser}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Impressões Entregues</span>
                <p className="text-sm font-bold text-white font-mono">{selectedAdvData.totalImpressions.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Cliques Registrados</span>
                <p className="text-sm font-bold text-blue-400 font-mono">{selectedAdvData.totalClicks.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">CTR Consolidado</span>
                <p className="text-sm font-bold text-emerald-400 font-mono">{selectedAdvData.ctr}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela de Campanhas */}
      <div className="card border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Campanhas Cadastradas ({filteredCampaigns.length})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Controle de status, progresso de capping e links de veiculação.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Filter size={14} /> Status:
            </span>
            {['all', 'active', 'scheduled', 'paused', 'expired'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  background: selectedStatus === st ? 'rgba(255, 31, 31, 0.2)' : 'transparent',
                  borderColor: selectedStatus === st ? 'var(--primary)' : 'var(--border)',
                  color: selectedStatus === st ? '#ffffff' : 'var(--text-muted)',
                }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase transition-all"
              >
                {st === 'all' ? 'Todas' : st}
              </button>
            ))}

            <button
              onClick={loadData}
              title="Recarregar"
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-white"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-400" />
            Carregando campanhas do PocketBase...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Megaphone size={40} className="mx-auto text-[var(--text-muted)] opacity-40" />
            <h3 className="text-base font-bold text-white">Nenhuma campanha encontrada</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Crie a sua primeira campanha direta para veicular banners nos apps móveis do ecossistema.
            </p>
            <Link
              href="/adminpanel/ads/new"
              style={{ background: 'var(--primary)' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white hover:brightness-110"
            >
              <Plus size={16} />
              Criar Campanha Agora
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--surface)]">
                <tr>
                  <th className="py-3 px-4">Arte</th>
                  <th className="py-3 px-4">Campanha / Empresa</th>
                  <th className="py-3 px-4">Local (Placement)</th>
                  <th className="py-3 px-4">Apps Alvo</th>
                  <th className="py-3 px-4">Progresso / Capping</th>
                  <th className="py-3 px-4">Cliques (CTR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-medium">
                {filteredCampaigns.map((camp) => {
                  const placeInfo = placementLabels[camp.placement] || {
                    name: camp.placement,
                    isFree: false,
                  };
                  const cappingRatio =
                    camp.max_impressions > 0
                      ? Math.min(100, (camp.impressions_count / camp.max_impressions) * 100)
                      : 0;
                  const ctr =
                    camp.impressions_count > 0
                      ? ((camp.clicks_count / camp.impressions_count) * 100).toFixed(2)
                      : '0.00';

                  return (
                    <tr key={camp.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Arte Thumbnail */}
                      <td className="py-3 px-4">
                        {camp.creative_url ? (
                          <a
                            href={camp.creative_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-14 h-9 rounded-lg overflow-hidden border border-[var(--border)] bg-black shrink-0 relative group"
                          >
                            <img
                              src={camp.creative_url}
                              alt={camp.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </a>
                        ) : (
                          <div className="w-14 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                            Sem arte
                          </div>
                        )}
                      </td>

                      {/* Título & Empresa */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <p className="font-bold text-white text-xs truncate">{camp.title}</p>
                        <p className="text-[11px] text-amber-400 font-semibold truncate flex items-center gap-1">
                          <Building2 size={12} />
                          {camp.advertiser || 'Sem Anunciante'}
                        </p>
                      </td>

                      {/* Placement */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            placeInfo.isFree
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              placeInfo.isFree ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          {placeInfo.name}
                        </span>
                      </td>

                      {/* Apps Alvo */}
                      <td className="py-3 px-4">
                        {camp.target_apps.includes('all') ? (
                          <span className="badge badge-live text-[9px] px-2 py-0.5 font-bold">
                            🌐 TODOS OS APPS
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">
                            {camp.target_apps.length} app(s)
                          </span>
                        )}
                      </td>

                      {/* Progresso / Capping */}
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-white font-bold">
                              {camp.impressions_count.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {camp.max_impressions > 0
                                ? `/ ${camp.max_impressions.toLocaleString('pt-BR')}`
                                : 'Ilimitado'}
                            </span>
                          </div>
                          {camp.max_impressions > 0 && (
                            <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all"
                                style={{ width: `${cappingRatio}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cliques & CTR */}
                      <td className="py-3 px-4 font-mono">
                        <p className="text-white font-bold">{camp.clicks_count}</p>
                        <p className="text-[10px] text-blue-400 font-semibold">{ctr}% CTR</p>
                      </td>

                      {/* Status Semafórico */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            camp.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : camp.status === 'scheduled'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : camp.status === 'paused'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                          }`}
                        >
                          {camp.status === 'active' && '🟢 Ativa'}
                          {camp.status === 'scheduled' && '🔵 Agendada'}
                          {camp.status === 'paused' && '🟡 Pausada'}
                          {camp.status === 'expired' && '⚪ Expirada'}
                          {camp.status === 'draft' && '📝 Rascunho'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(camp)}
                            disabled={actionLoading === camp.id}
                            title={camp.status === 'active' ? 'Pausar Campanha' : 'Ativar Campanha'}
                            className={`p-2 rounded-xl border transition-all ${
                              camp.status === 'active'
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {camp.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                          </button>

                          <a
                            href={camp.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir Link de Destino"
                            className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)] transition-all"
                          >
                            <ExternalLink size={14} />
                          </a>

                          <button
                            onClick={() => handleDelete(camp.id, camp.title)}
                            disabled={actionLoading === camp.id}
                            title="Excluir Campanha"
                            className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
