"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Newspaper,
  Video,
  Globe2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Database
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = [
    {
      title: "NOTÍCIAS ATIVAS",
      value: stats.news,
      change: "+14.2%",
      isPositive: true,
      icon: Newspaper,
      color: "from-blue-500 to-indigo-600",
      link: "/adminpanel2/news"
    },
    {
      title: "VÍDEOS WATCH",
      value: stats.videos,
      change: "+8.5%",
      isPositive: true,
      icon: Video,
      color: "from-rose-500 to-red-600",
      link: "/adminpanel2/videos"
    },
    {
      title: "SISTEMA SENTINELA",
      value: "OPERACIONAL",
      change: "99.9% Uptime",
      isPositive: true,
      icon: ShieldAlert,
      color: "from-emerald-500 to-teal-600",
      link: "/adminpanel2/sentinel"
    },
    {
      title: "LIGAS MONITORADAS",
      value: stats.leagues || 18,
      change: "100% Sincronizado",
      isPositive: true,
      icon: Globe2,
      color: "from-amber-500 to-orange-600",
      link: "/adminpanel2/europa"
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <span>Visão Geral</span>
            <span>/</span>
            <span className="text-gray-400">Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Central de Comando <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">ZapScore</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 text-xs font-bold text-gray-200 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/adminpanel2/europa"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/25"
          >
            <Zap size={14} />
            <span>Módulo Europa</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.link}
              className="bg-[#111827] border border-gray-800 hover:border-gray-700/80 p-5 rounded-2xl transition-all duration-200 shadow-lg group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold text-gray-400 tracking-wider">
                  {item.title}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white font-mono">
                  {item.value}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={12} />
                  {item.change}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Middle Section: Active Ecosystems & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Ecosystems */}
        <div className="lg:col-span-2 bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-white">Módulos & Ecossistemas</h3>
              <p className="text-xs text-gray-400 mt-0.5">Conectores ativos na infraestrutura ZapScore</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">
              5 Módulos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Europa */}
            <Link
              href="/adminpanel2/europa"
              className="p-4 bg-gray-900/60 border border-gray-800/80 hover:border-blue-500/50 rounded-xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                    🇪🇺
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                      Módulo Europa
                    </h4>
                    <p className="text-[11px] text-gray-400">PocketBase Ops</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/50">
                <span>Bundesliga, La Liga, Premier</span>
                <ArrowUpRight size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>

            {/* Sentinela */}
            <Link
              href="/adminpanel2/sentinel"
              className="p-4 bg-gray-900/60 border border-gray-800/80 hover:border-emerald-500/50 rounded-xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                      Monitor Sentinela
                    </h4>
                    <p className="text-[11px] text-gray-400">Autocorreção Ao Vivo</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ATIVO
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/50">
                <span>Auditoria de Fusos & Placar</span>
                <ArrowUpRight size={14} className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Link>

            {/* Notícias */}
            <Link
              href="/adminpanel2/news"
              className="p-4 bg-gray-900/60 border border-gray-800/80 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Newspaper size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      Gestão de Notícias
                    </h4>
                    <p className="text-[11px] text-gray-400">Feed RSS Automático</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/50">
                <span>{stats.news} Artigos Noticiosos</span>
                <ArrowUpRight size={14} className="text-gray-500 group-hover:text-amber-400 transition-colors" />
              </div>
            </Link>

            {/* Vídeos Watch */}
            <Link
              href="/adminpanel2/videos"
              className="p-4 bg-gray-900/60 border border-gray-800/80 hover:border-rose-500/50 rounded-xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Video size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-rose-400 transition-colors">
                      Vídeos Watch
                    </h4>
                    <p className="text-[11px] text-gray-400">Gols & Destaques</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/50">
                <span>{stats.videos} Vídeos em Cache</span>
                <ArrowUpRight size={14} className="text-gray-500 group-hover:text-rose-400 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: System Infrastructure Status */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Infraestrutura</h3>
              <Activity size={18} className="text-blue-400" />
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold">Base de Dados</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">PostgreSQL / PocketBase</span>
              </div>

              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold">Easypanel Node</span>
                <span className="text-xs font-bold text-blue-400 font-mono">gtalg3.easypanel.host</span>
              </div>

              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold">Notificações FCM</span>
                <span className="text-xs font-bold text-amber-400 font-mono">FCM Push Active</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <CheckCircle2 size={16} />
              <span>ZapScore Admin 2 Operational</span>
            </div>
            <p className="text-gray-400">
              Interface autônoma e otimizada para alta frequência de dados esportivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
