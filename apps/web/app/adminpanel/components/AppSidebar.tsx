'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Globe, 
  Flag, 
  Trophy, 
  Newspaper, 
  Video, 
  Rss,
  ChevronDown,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { ECOSYSTEM_MODULES } from "../registry";

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/adminpanel") return pathname === "/adminpanel";
    return pathname.startsWith(path);
  };

  const sidebarVisible = isExpanded || isHovered;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col ${
        isMobileOpen
          ? "translate-x-0 w-64"
          : "max-lg:-translate-x-full"
      } ${
        sidebarVisible ? "lg:w-64" : "lg:w-20"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between shrink-0">
        <Link href="/adminpanel" className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20 shrink-0 text-xl">
            ⚡
          </div>
          {sidebarVisible && (
            <div className="min-w-0 transition-opacity duration-200">
              <h1 className="text-base font-black bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 bg-clip-text text-transparent italic tracking-tight truncate">
                ZAPSCORE
              </h1>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase truncate">
                Command Center
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Visão Geral */}
        <div>
          {sidebarVisible && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 transition-opacity">
              Visão Geral
            </p>
          )}
          <div className="space-y-1">
            <Link
              href="/adminpanel"
              className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/adminpanel")
                  ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              } ${!sidebarVisible ? "justify-center px-0" : "justify-between"}`}
              title="Dashboard"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <LayoutDashboard size={18} className={isActive("/adminpanel") ? "text-orange-400" : "text-slate-400"} />
                {sidebarVisible && <span className="truncate">Dashboard</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/sentinel"
              className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/adminpanel/sentinel")
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              } ${!sidebarVisible ? "justify-center px-0" : "justify-between"}`}
              title="Monitor Sentinela"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <ShieldCheck size={18} className={isActive("/adminpanel/sentinel") ? "text-emerald-400" : "text-slate-400"} />
                {sidebarVisible && <span className="truncate">Sentinela</span>}
              </div>
              {sidebarVisible && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 ml-1">
                  Ativo
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Ecossistemas */}
        <div>
          {sidebarVisible && (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Módulos Ligas
              </p>
              <Sparkles size={11} className="text-amber-400 animate-pulse" />
            </div>
          )}
          <div className="space-y-1">
            {ECOSYSTEM_MODULES.map((module) => {
              const IconComp = module.icon;
              const active = isActive(module.href);
              return (
                <Link
                  key={module.id}
                  href={module.href}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  } ${!sidebarVisible ? "justify-center px-0" : "justify-between"}`}
                  title={module.name}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <IconComp size={18} className={active ? "text-orange-400" : "text-slate-400"} />
                    {sidebarVisible && <span className="truncate">{module.shortName}</span>}
                  </div>
                  {sidebarVisible && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border shrink-0 ml-1 ${module.badgeColor}`}>
                      {module.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Conteúdo */}
        <div>
          {sidebarVisible && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Gestão Conteúdo
            </p>
          )}
          <div className="space-y-1">
            <Link
              href="/adminpanel/news"
              className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/adminpanel/news") && !isActive("/adminpanel/news/sources")
                  ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              } ${!sidebarVisible ? "justify-center px-0" : "justify-between"}`}
              title="Notícias"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Newspaper size={18} className={isActive("/adminpanel/news") && !isActive("/adminpanel/news/sources") ? "text-orange-400" : "text-slate-400"} />
                {sidebarVisible && <span className="truncate">Notícias</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/news/sources"
              className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/adminpanel/news/sources")
                  ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              } ${!sidebarVisible ? "justify-center px-0" : "justify-between"}`}
              title="Fontes RSS"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Rss size={18} className={isActive("/adminpanel/news/sources") ? "text-orange-400" : "text-slate-400"} />
                {sidebarVisible && <span className="truncate">Fontes RSS</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/videos"
              className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/adminpanel/videos")
                  ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              } ${!sidebarVisible ? "justify-center px-0" : "justify-between"}`}
              title="Vídeos"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Video size={18} className={isActive("/adminpanel/videos") ? "text-orange-400" : "text-slate-400"} />
                {sidebarVisible && <span className="truncate">Vídeos</span>}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        {sidebarVisible ? (
          <>
            <span>ZapScore Platform</span>
            <span className="font-mono text-slate-400 font-bold">v2.4.0</span>
          </>
        ) : (
          <span className="mx-auto font-mono text-slate-400 font-bold">v2.4</span>
        )}
      </div>
    </aside>
  );
}
