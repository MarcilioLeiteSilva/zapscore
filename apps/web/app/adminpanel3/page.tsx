'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  ShieldCheck, 
  Newspaper, 
  Video, 
  Activity, 
  Radio,
  ArrowRight,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../(main)/adminpanel/registry';

const API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

export default function Admin3Dashboard() {
  const [stats, setStats] = useState({ news: 0, videos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [newsRes, videosRes] = await Promise.all([
          fetch(`${API_URL}/news?limit=100`),
          fetch(`${API_URL}/videos?limit=100`),
        ]);
        const newsData = newsRes.ok ? await newsRes.json() : [];
        const videosData = videosRes.ok ? await videosRes.json() : [];
        setStats({
          news: Array.isArray(newsData) ? newsData.length : 0,
          videos: Array.isArray(videosData) ? videosData.length : 0,
        });
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black rounded-full border border-red-500/30 uppercase tracking-widest flex items-center gap-1.5">
              <Radio size={14} className="animate-pulse" />
              <span>PAINEL ADMIN 3.0 — LARGURA 90% ATIVA</span>
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Comando Central <span style={{ color: 'var(--primary)' }}>ZapScore</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Interface administrativa independente de alta performance com respiros laterais simétricos de 5%.
          </p>
        </div>

        <div className="card glass px-5 py-3 rounded-2xl flex items-center gap-3 border border-[var(--glass-border)] shrink-0">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Servidor On & Sincronizado</span>
        </div>
      </div>

      {/* KPI Cards de Alto Nível */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-5 flex items-center justify-between group hover:border-[var(--primary)] transition-all">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Notícias Publicadas</p>
            <p className="text-3xl font-black text-white font-mono mt-1">{loading ? '...' : stats.news}</p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span>● Feeds RSS Conectados</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Newspaper size={24} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between group hover:border-red-500/40 transition-all">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Vídeos na Watch</p>
            <p className="text-3xl font-black text-red-400 font-mono mt-1">{loading ? '...' : stats.videos}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Highlights & Gols
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <Video size={24} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between group hover:border-amber-500/40 transition-all">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ecossistemas</p>
            <p className="text-3xl font-black text-amber-400 font-mono mt-1">{ECOSYSTEM_MODULES.length}</p>
            <p className="text-[11px] text-amber-400/80 font-semibold mt-1">
              Europa, Brasil & Copas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy size={24} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between group hover:border-emerald-500/40 transition-all">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status Engine</p>
            <p className="text-3xl font-black text-emerald-400 font-mono mt-1">100%</p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Monitor Sentinela OK</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Módulos & Monitor Sentinela */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna Principal: Módulos & Ligas */}
        <div className="lg:col-span-2 card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Trophy size={22} className="text-amber-400" />
              <span>Módulos de Ligas e Competitivos</span>
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {ECOSYSTEM_MODULES.length} ECOSSISTEMAS
            </span>
          </div>

          <div className="space-y-4">
            {ECOSYSTEM_MODULES.map((module) => {
              const IconComp = module.icon;
              const module3Href = module.href.replace('/adminpanel', '/adminpanel3');
              return (
                <Link
                  key={module.id}
                  href={module3Href}
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                  className="p-5 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-[var(--border)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform shrink-0">
                      <IconComp size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white group-hover:text-[var(--primary)] transition-colors">
                          {module.name}
                        </h3>
                        <span className="badge badge-ft text-[10px] px-2 py-0.5 font-bold">
                          {module.leagues?.length ?? 0} Ligas
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Gestão de ligas, notícias, vídeos e artilharia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-[var(--text-muted)] group-hover:text-white transition-colors hidden sm:inline">
                      Gerenciar Ligas
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-white group-hover:bg-[var(--primary)] group-hover:text-black group-hover:border-[var(--primary)] transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Resumo Sentinela & Ações */}
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span>Status do Sentinela</span>
              </h2>
              <span className="badge badge-ft text-[10px]">ONLINE</span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              O Monitor Sentinela está auditando automaticamente o fuso horário, integridade dos placares e atualizações dos feeds RSS em tempo real.
            </p>

            <Link
              href="/adminpanel3/sentinel"
              className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <Activity size={16} />
              <span>Abrir Monitor Sentinela</span>
            </Link>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold pb-3 border-b border-[var(--border)]">
              <Sparkles size={18} />
              <span>Recursos do Admin 3.0</span>
            </div>
            <ul className="text-xs text-[var(--text-muted)] space-y-2.5">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Container de 90% de largura nativa
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Margens laterais exatas de 5%
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Layout desacoplado do site principal
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Modais de cadastro com rolagem
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
