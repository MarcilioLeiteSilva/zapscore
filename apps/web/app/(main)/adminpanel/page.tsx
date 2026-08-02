"use client";

import React, { useEffect, useState } from "react";
import { Newspaper, Video, Trophy, ShieldCheck, Activity, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

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
          news: news.length,
          videos: vids.length,
          leagues: leagues.length,
          teams: teams.length
        });
      } catch (e) {
        console.error("Erro ao carregar estatísticas");
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Monitor Sentinela", value: "Ativo", icon: ShieldCheck, badge: "badge-live", link: "/adminpanel/sentinel" },
    { title: "Notícias Ativas", value: stats.news, icon: Newspaper, badge: "badge-ft", link: "/adminpanel/news" },
    { title: "Vídeos na Watch", value: stats.videos, icon: Video, badge: "badge-ft", link: "/adminpanel/videos" },
    { title: "Ligas Monitoradas", value: stats.leagues, icon: Trophy, badge: "badge-ft", link: "/adminpanel/europa" },
  ];

  return (
    <div className="space-y-8">
      {/* Header do Comando Central */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>Comando Central</span>
            <span className="badge badge-live">Live Hub</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Gestão integrada e tempo real da plataforma ZapScore.
          </p>
        </div>

        <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-[var(--glass-border)]">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">API Produção Online</span>
        </div>
      </div>

      {/* Grid de Cards com Estilo ZapScore Nativo (.card / .glass) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link href={card.link} key={i} className="card group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>
                  <span className={`badge ${card.badge}`}>{card.value}</span>
                </div>
                <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-wider mb-1">{card.title}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="text-xs font-bold text-white group-hover:text-[var(--primary)] transition-colors">Acessar</span>
                <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Seção Status de Automação & Card Destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card glass space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="text-[var(--primary)]" size={24} />
            <h4 className="text-xl font-bold text-white uppercase tracking-tight">Status da Automação ZapScore</h4>
          </div>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            A plataforma ZapScore está configurada para sincronizar dados, placares ao vivo e mídias de todas as ligas monitoradas automaticamente via microsserviços.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-white font-bold uppercase text-xs tracking-wider">Último Sync</span>
              <span className="text-emerald-400 text-sm font-black font-mono">OK / 100%</span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex justify-between items-center">
              <span className="text-white font-bold uppercase text-xs tracking-wider">Base de Dados</span>
              <span className="text-emerald-400 text-sm font-black font-mono uppercase">Ativa</span>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-[#ff1f1f] to-red-800 text-white p-8 flex flex-col justify-between border-0 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <h4 className="text-2xl font-black uppercase italic leading-tight">Módulo Europa Ativo</h4>
            <p className="text-white/80 text-xs font-medium">
              Gerencie todas as 5 competições da Suíte Europa e envie notificações push com 1 clique.
            </p>
          </div>

          <Link
            href="/adminpanel/europa"
            className="mt-6 inline-flex items-center justify-center gap-2 bg-white text-[var(--primary)] font-black px-5 py-3 rounded-xl shadow-lg hover:bg-slate-100 transition-colors uppercase tracking-wider text-xs relative z-10"
          >
            <span>Acessar Módulo Europa</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
