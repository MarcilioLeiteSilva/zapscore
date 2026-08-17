"use client";

import React, { useEffect, useState } from "react";
import { 
  Newspaper, 
  Video, 
  Trophy, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Zap,
  Globe,
  Radio,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { ECOSYSTEM_MODULES } from "./registry";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ news: 0, videos: 0, leagues: 0, teams: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [news, vids, leagues, teams] = await Promise.all([
          fetch(`${API_URL}/news`).then(r => r.json()),
          fetch(`${API_URL}/videos`).then(r => r.json()),
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
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-10" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="badge badge-live">
              • FASE 2: GESTÃO & COMANDO ATIVO
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Comando Central <span style={{ color: 'var(--primary)' }}>ZapScore</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Painel de controle unificado para monitorar estatísticas, conectores de dados, mídias e ecossistemas em tempo real.
          </p>
        </div>

        <div className="card glass px-5 py-3 rounded-2xl flex items-center gap-3 border border-[var(--glass-border)] shrink-0">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">API Produção Online</span>
        </div>
      </div>

      {/* KPI Cards de Alto Nível */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-5 flex items-center justify-between group hover:border-[var(--primary)] transition-all">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Notícias Publicadas</p>
            <p className="text-3xl font-black text-white font-mono mt-1">{stats.news}</p>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span>● Feeds RSS Ativos</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Newspaper size={24} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between group hover:border-red-500/40 transition-all">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Vídeos na Watch</p>
            <p className="text-3xl font-black text-red-400 font-mono mt-1">{stats.videos}</p>
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

      {/* Grid de 2 Colunas - Idêntico ao Layout Premium do ZapScore */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna Principal (2 Terços) */}
        <div className="lg:col-span-2 card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Trophy size={22} className="text-amber-400" />
              <span>Módulos & Competições Ativas</span>
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {ECOSYSTEM_MODULES.length} ECOSSISTEMAS
            </span>
          </div>

          <div className="space-y-4">
            {/* Lista dos Módulos do Ecossistema */}
            {ECOSYSTEM_MODULES.map((module) => {
              const IconComp = module.icon;
              return (
                <Link
                  key={module.id}
                  href={module.href}
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                  className="p-5 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl font-bold shrink-0">
                      <IconComp size={22} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors text-base flex items-center gap-2">
                        <span>{module.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${module.badgeColor}`}>
                          {module.badge}
                        </span>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {module.leagues.map(l => l.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-ft text-xs px-3 py-1.5 shrink-0">• ONLINE</span>
                </Link>
              );
            })}

            {/* Sentinela */}
            <Link
              href="/adminpanel/sentinel"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-5 rounded-2xl flex items-center justify-between hover:border-emerald-500/40 transition-all group shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-base">
                    Monitor Sentinela (Autocorreção)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Auditoria contínua de fusos, placares ao vivo e consistência
                  </p>
                </div>
              </div>
              <span className="badge badge-live text-xs px-3 py-1.5 shrink-0">• AUDITORIA ATIVA</span>
            </Link>

            {/* Gestão de Notícias */}
            <Link
              href="/adminpanel/news"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-5 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                  <Newspaper size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors text-base">
                    Central de Notícias & Fontes RSS
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {stats.news} Matérias jornalísticas publicadas na plataforma
                  </p>
                </div>
              </div>
              <span className="badge badge-ft text-xs px-3 py-1.5 shrink-0">• ONLINE</span>
            </Link>

            {/* Gestão de Vídeos */}
            <Link
              href="/adminpanel/videos"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-5 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors text-base">
                    Vídeos na Watch (Gols & Melhores Momentos)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {stats.videos} Vídeos ativos em streaming
                  </p>
                </div>
              </div>
              <span className="badge badge-ft text-xs px-3 py-1.5 shrink-0">• ONLINE</span>
            </Link>
          </div>
        </div>

        {/* Coluna da Direita (1 Terço): Engine Status */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
            <Zap size={22} style={{ color: 'var(--primary)' }} />
            <h2 className="text-xl font-bold text-white">Engine Status</h2>
          </div>

          {/* Health Check Block */}
          <div 
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
            className="p-5 rounded-2xl space-y-2"
          >
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Health Check
            </p>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Sistema Operacional</h3>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>

          {/* Versão e Ambiente */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-4 rounded-2xl"
            >
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Versão
              </p>
              <p className="text-base font-black text-white font-mono">2.4.0</p>
            </div>

            <div 
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-4 rounded-2xl"
            >
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Ambiente
              </p>
              <p className="text-base font-black text-emerald-400 font-mono">production</p>
            </div>
          </div>

          {/* Recorde Temporal Ativo */}
          <div 
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
            className="p-5 rounded-2xl space-y-1"
          >
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Recorde Temporal Ativo
            </p>
            <p className="text-4xl font-black text-[var(--primary)] font-mono">2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
