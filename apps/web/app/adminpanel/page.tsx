"use client";

import React, { useEffect, useState } from "react";
import { Newspaper, Video, Trophy, Users, Activity, ExternalLink } from "lucide-react";
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
    { title: "Notícias Ativas", value: stats.news, icon: Newspaper, color: "text-orange-500", bg: "bg-orange-500/10", link: "/adminpanel/news" },
    { title: "Vídeos na Watch", value: stats.videos, icon: Video, color: "text-red-500", bg: "bg-red-500/10", link: "/adminpanel/videos" },
    { title: "Ligas Monitoradas", value: stats.leagues, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", link: "#" },
    { title: "Times no Banco", value: stats.teams, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", link: "#" },
  ];

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-center text-white">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Comando Central</h1>
          <p className="text-slate-400 font-medium">Gestão integrada da plataforma ZapScore.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 shadow-xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-300">API Produção Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card, i) => (
          <Link href={card.link} key={i} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-orange-500/50 transition-all shadow-xl group">
            <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon className={`${card.color}`} size={28} />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{card.title}</p>
            <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-white">{card.value}</h3>
                <ExternalLink size={16} className="text-slate-700 group-hover:text-white transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 mb-4">
                <Activity className="text-orange-500" />
                <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">Status da Automação</h4>
            </div>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                O ZapScore está configurado para buscar novas notícias e vídeos automaticamente a cada 6 horas através do serviço de sincronização do backend.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-white font-bold uppercase text-xs tracking-widest">Último Sync</span>
                    <span className="text-orange-500 text-sm font-black font-mono">OK</span>
                </div>
                <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-white font-bold uppercase text-xs tracking-widest">Base de Dados</span>
                    <span className="text-green-500 text-sm font-black font-mono uppercase">Ativa</span>
                </div>
            </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-red-700 p-10 rounded-3xl shadow-2xl flex flex-col justify-center text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <Newspaper size={120} />
            </div>
            <h4 className="text-3xl font-black uppercase italic leading-tight mb-4">Pronto para o Próximo Nível?</h4>
            <p className="text-orange-100 font-medium mb-6">Sua plataforma está 100% dinâmica. Gerencie notícias e vídeos em segundos.</p>
            <button className="bg-white text-orange-600 font-black px-6 py-3 rounded-xl shadow-lg hover:bg-orange-50 transition-colors uppercase tracking-widest text-xs">Acessar News</button>
        </div>
      </div>
    </div>
  );
}
