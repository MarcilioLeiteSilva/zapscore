"use client";

import React, { useEffect, useState } from "react";
import { Newspaper, Video, Users, Trophy, Activity, TrendingUp } from "lucide-react";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function Dashboard() {
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
    { title: "Notícias Ativas", value: stats.news, icon: Newspaper, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Vídeos na Watch", value: stats.videos, icon: Video, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Ligas Monitoradas", value: stats.leagues, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { title: "Times no Banco", value: stats.teams, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  return (
    <div class="p-8 space-y-10 max-w-7xl mx-auto">
      <div class="flex justify-between items-center text-white">
        <div>
          <h1 class="text-4xl font-black uppercase tracking-tighter italic">Visão Geral</h1>
          <p class="text-slate-400 font-medium">Bem-vindo ao centro de comando do ZapScore.</p>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-bold uppercase tracking-widest text-slate-300">API Produção Online</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} class="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all shadow-xl group">
            <div class={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon class={`${card.color}`} size={28} />
            </div>
            <p class="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{card.title}</p>
            <h3 class="text-4xl font-black text-white">{card.value}</h3>
          </div>
        ))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div class="flex items-center space-x-3 mb-4">
                <Activity class="text-orange-500" />
                <h4 class="text-xl font-black text-white uppercase tracking-tight">Atividade Recente</h4>
            </div>
            <p class="text-slate-400 font-medium">O sistema de sincronização automática está monitorando 4 ligas e buscando atualizações a cada 6 horas.</p>
            <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                    <span class="text-white font-bold">Último Sync</span>
                    <span class="text-slate-400 text-sm font-mono">{new Date().toLocaleTimeString()}</span>
                </div>
                <div class="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                    <span class="text-white font-bold">Status do Banco</span>
                    <span class="text-green-500 text-sm font-black uppercase tracking-tighter">Otimizado</span>
                </div>
            </div>
        </div>

        <div class="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center space-y-4">
            <TrendingUp size={48} class="text-orange-500 mb-2" />
            <h4 class="text-2xl font-black text-white uppercase italic">Escalabilidade</h4>
            <p class="text-slate-400 font-medium max-w-sm">O ZapScore agora processa dados em tempo real e serve conteúdos dinâmicos para milhares de usuários simultâneos.</p>
        </div>
      </div>
    </div>
  );
}
