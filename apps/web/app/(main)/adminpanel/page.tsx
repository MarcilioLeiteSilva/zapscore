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
      {/* Hero Section - Idêntico à Foto 1 */}
      <div className="text-center py-6">
        <span className="badge badge-live mb-4">
          • FASE 2: GESTÃO & COMANDO ATIVO
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
          Comando Central <span style={{ color: 'var(--primary)' }}>ZapScore</span>
        </h1>
        <p className="text-[var(--text-muted)] text-base max-w-xl mx-auto">
          Painel de controle unificado para monitorar estatísticas, conectores de dados, mídias e ecossistemas em tempo real.
        </p>

        <div className="flex items-center justify-center gap-4 mt-6">
          <Link
            href="/adminpanel/europa"
            style={{ background: 'var(--primary)', boxShadow: '0 0 20px var(--primary-glow)' }}
            className="px-6 py-3 rounded-full text-white font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span>Módulo Europa</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/adminpanel/sentinel"
            className="card py-3 px-6 rounded-full text-white font-bold text-sm hover:border-[var(--primary)] transition-all flex items-center gap-2"
          >
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Monitor Sentinela</span>
          </Link>
        </div>
      </div>

      {/* Grid de 2 Colunas - Idêntico à Foto 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna da Esquerda (2 Terços): Lista de Módulos & Ligas Monitoradas */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              <span>Módulos & Competições Ativas</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
              {ECOSYSTEM_MODULES.length} ECOSSISTEMAS
            </span>
          </div>

          <div className="space-y-3">
            {/* Item 1: Módulo Europa */}
            <Link
              href="/adminpanel/europa"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-4 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  🇪🇺
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors text-sm">
                    Módulo Europa (PocketBase)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Bundesliga, La Liga, Premier League, Ligue 1, Serie A
                  </p>
                </div>
              </div>
              <span className="badge badge-ft">• ONLINE</span>
            </Link>

            {/* Item 2: Sentinela */}
            <Link
              href="/adminpanel/sentinel"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                    Monitor Sentinela (Autocorreção)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Auditoria de fusos, placares ao vivo e consistência
                  </p>
                </div>
              </div>
              <span className="badge badge-live">• AUDITORIA ATIVA</span>
            </Link>

            {/* Item 3: Gestão de Notícias */}
            <Link
              href="/adminpanel/news"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-4 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Newspaper size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors text-sm">
                    Central de Notícias & RSS
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {stats.news} Matérias jornalísticas sincronizadas
                  </p>
                </div>
              </div>
              <span className="badge badge-ft">• ONLINE</span>
            </Link>

            {/* Item 4: Gestão de Vídeos */}
            <Link
              href="/adminpanel/videos"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              className="p-4 rounded-2xl flex items-center justify-between hover:border-[var(--primary)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors text-sm">
                    Vídeos na Watch (Gols & Melhores Momentos)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {stats.videos} Vídeos ativos na plataforma
                  </p>
                </div>
              </div>
              <span className="badge badge-ft">• ONLINE</span>
            </Link>
          </div>
        </div>

        {/* Coluna da Direita (1 Terço): Engine Status - Idêntico ao Card da Direita da Foto 1 */}
        <div className="card space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
            <Zap size={20} style={{ color: 'var(--primary)' }} />
            <h2 className="text-lg font-bold text-white">Engine Status</h2>
          </div>

          {/* Health Check Block */}
          <div 
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
            className="p-4 rounded-2xl space-y-2"
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
            className="p-4 rounded-2xl space-y-1"
          >
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Recorde Temporal Ativo
            </p>
            <p className="text-3xl font-black text-[var(--primary)] font-mono">2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
