"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Newspaper,
  Video,
  Globe2,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Trophy,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { ECOSYSTEM_MODULES } from "./registry";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function AdminDashboard2() {
  const [stats, setStats] = useState({ news: 0, videos: 0, leagues: 0, teams: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [news, vids, leagues, teams] = await Promise.all([
        fetch(`${API_URL}/news?limit=100`).then(r => r.json()),
        fetch(`${API_URL}/videos?limit=100`).then(r => r.json()),
        fetch(`${API_URL}/leagues`).then(r => r.json()),
        fetch(`${API_URL}/teams`).then(r => r.json()),
      ]);
      setStats({
        news: Array.isArray(news) ? news.length : 0,
        videos: Array.isArray(vids) ? vids.length : 0,
        leagues: Array.isArray(leagues) ? leagues.length : 0,
        teams: Array.isArray(teams) ? teams.length : 0
      });
    } catch (e) {
      console.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', fontFamily: 'var(--font-outfit)' }}>
      {/* Header Gradiente Estilo /competitions */}
      <div 
        className="card glass" 
        style={{ 
          padding: '2.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem', 
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255, 31, 31, 0.05) 100%)',
          borderRadius: '24px'
        }}
      >
        <div 
          style={{ 
            width: '90px', 
            height: '90px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '3rem', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            border: '1px solid var(--glass-border)'
          }}
        >
          ⚡
        </div>
        <div>
          <div className="badge badge-ft" style={{ marginBottom: '0.5rem', background: 'rgba(0, 255, 136, 0.1)', color: 'var(--success)', fontWeight: '800' }}>
            ZAPSCORE ADMIN 2.0 • FLUID DESIGN
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '900', color: 'white' }}>
            Comando Central & Operações
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--success)' }}>● SISTEMA 100% ONLINE</span>
            <span>•</span>
            <span>LAYOUT AUTO-RESPONSIVO MINMAX(380PX)</span>
          </div>
        </div>
      </div>

      {/* Grid Fluido de 4 Métricas Estilo /competitions (minmax 380px) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
        <Link href="/adminpanel2/news" className="card p-6 group hover:border-[var(--primary)] transition-all">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Notícias Registradas</span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Newspaper size={20} />
            </div>
          </div>
          <div className="pt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white font-mono">{loading ? '...' : stats.news}</h3>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Feeds RSS Ativos
            </span>
          </div>
        </Link>

        <Link href="/adminpanel2/videos" className="card p-6 group hover:border-red-500/40 transition-all">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Vídeos na Watch</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Video size={20} />
            </div>
          </div>
          <div className="pt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-red-400 font-mono">{loading ? '...' : stats.videos}</h3>
            <span className="text-xs font-bold text-slate-400">Highlights & Gols</span>
          </div>
        </Link>

        <Link href="/adminpanel2/sentinel" className="card p-6 group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Monitor Sentinela</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="pt-4 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-emerald-400">HEALTHY</h3>
            <span className="text-xs font-bold text-emerald-400">99.9% Uptime</span>
          </div>
        </Link>

        <Link href="/adminpanel2/europa" className="card p-6 group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Ecossistemas & Ligas</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Globe2 size={20} />
            </div>
          </div>
          <div className="pt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-amber-400 font-mono">{ECOSYSTEM_MODULES.length}</h3>
            <span className="text-xs font-bold text-amber-400/80">Europa & Brasil</span>
          </div>
        </Link>
      </div>

      {/* Grid de Módulos com a Mesma Trava Fluida (minmax 380px) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Trophy size={22} className="text-amber-400" />
            <span>Módulos de Ligas e Competitivos</span>
          </h2>
          <span className="badge badge-ft text-[10px]">LARGURA AUTO-COMPATÍVEL</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {ECOSYSTEM_MODULES.map((module) => {
            const IconComp = module.icon;
            return (
              <Link
                key={module.id}
                href={module.href.replace('/adminpanel', '/adminpanel2')}
                className="card p-6 group hover:border-[var(--primary)] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[var(--border)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform shrink-0">
                    <IconComp size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-[var(--primary)] transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {module.leagues?.length ?? 5} Ligas Monitoradas
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--text-muted)] group-hover:text-white transition-colors">
                  <span>Gerenciar Módulo</span>
                  <ArrowRight size={16} className="group-hover:text-[var(--primary)] transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
