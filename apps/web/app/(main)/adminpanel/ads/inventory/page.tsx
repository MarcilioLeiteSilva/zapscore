'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  Megaphone,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Smartphone,
  Copy,
  Check,
  Building2,
  TrendingUp,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

interface PlacementInventory {
  placement: string;
  name: string;
  admobStatus: 'free' | 'hybrid';
  recommendedSize: string;
  aspectRatio: string;
  description: string;
  activeCampaignsCount: number;
}

export default function AdsInventoryPage() {
  const [inventory, setInventory] = useState<PlacementInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/ads/inventory`);
        const json = await res.json();
        if (json.success) {
          setInventory(json.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar mapa de inventário:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleCopySize = (size: string, index: number) => {
    navigator.clipboard.writeText(size);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <Link
            href="/adminpanel/ads"
            className="text-xs font-bold text-[var(--text-muted)] hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para o Dashboard de Anúncios
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Compass className="text-amber-400 shrink-0" size={32} />
            Mapa de <span style={{ color: 'var(--primary)' }}>Inventário de Espaços</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs md:text-sm mt-1 max-w-3xl">
            Visão estratégica de todos os locais de veiculação nos aplicativos móveis, convivência sem conflito com o Google AdMob e ocupação em tempo real.
          </p>
        </div>

        <Link
          href="/adminpanel/ads/new"
          style={{ background: 'var(--primary)' }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Criar Nova Campanha</span>
        </Link>
      </div>

      {/* Cards Explicativos: Livre vs Híbrido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Espaços 100% Livres (Exclusivos House Ads)
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Locais nobres onde o <strong>Google AdMob não opera</strong>. Você possui 100% do inventário livre para comercializar patrocínios regionais diretos sem concorrência e com máxima visibilidade (Topo da Tabela, Pop-ups de Abertura e Cards entre Jogos).
          </p>
        </div>

        <div className="card p-5 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              Espaços Híbridos (Fallback ou Master)
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Locais onde o Google AdMob opera prioritariamente. O House Ad entra como <strong>salva-vidas instantâneo</strong> quando o AdMob não tiver anúncio para entregar (eliminando tela vazia) ou assume 100% como Patrocínio Master quando você vender exclusividade.
          </p>
        </div>
      </div>

      {/* Grid Detalhada de Placements */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers size={18} className="text-amber-400" />
          Locais Disponíveis nos Aplicativos ({inventory.length})
        </h2>

        {loading ? (
          <div className="card p-12 text-center text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-2xl">
            Carregando inventário do ecossistema...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {inventory.map((item, idx) => {
              const isFree = item.admobStatus === 'free';
              return (
                <div
                  key={item.placement}
                  className={`card p-5 border rounded-2xl bg-[var(--surface-card)] flex flex-col justify-between space-y-4 transition-all hover:border-amber-400/50 ${
                    isFree ? 'border-emerald-500/20' : 'border-amber-500/20'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge de Status AdMob & Ocupação */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isFree
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isFree ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        {isFree ? '100% LIVRE DE ADMOB' : 'HÍBRIDO COM ADMOB'}
                      </span>

                      <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold">
                        {item.activeCampaignsCount > 0 ? (
                          <span className="text-emerald-400 font-bold">
                            🟢 {item.activeCampaignsCount} ativa(s)
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-bold">⚪ 0 ativas</span>
                        )}
                      </span>
                    </div>

                    {/* Título do Local */}
                    <div>
                      <h3 className="text-base font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Especificações Técnicas de Tamanho */}
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-muted)]">Dimensão (@2x):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white">
                            {item.recommendedSize}
                          </span>
                          <button
                            onClick={() => handleCopySize(item.recommendedSize, idx)}
                            title="Copiar Dimensões"
                            className="text-amber-400 hover:text-white p-0.5"
                          >
                            {copiedIndex === idx ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-muted)]">Proporção:</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {item.aspectRatio}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ação: Criar Campanha para este Local */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <Link
                      href={`/adminpanel/ads/new`}
                      className="w-full py-2 rounded-xl text-xs font-bold text-center border border-[var(--border)] hover:border-amber-400 hover:text-white text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} className="text-amber-400" />
                      <span>Anunciar neste Espaço</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dicas Estratégicas para Venda de Patrocínio Regional */}
      <div className="card p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-card)] space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            💡 Dica Comercial para Monetização Direta
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Ao negociar patrocínio regional (como em apps estaduais para clássicos locais: Cruzeiro x Atlético, Palmeiras x Corinthians, Grêmio x Inter), o <strong>Topo da Tabela (`header_sponsor`)</strong> é o ativo de maior valor percebido pelo anunciante. Ele fica visível sempre que o torcedor checa a classificação e pode ser vendido por pacotes mensais fixos, garantindo receita 100% sua e sem intermediários.
        </p>
      </div>
    </div>
  );
}
