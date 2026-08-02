'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Globe, 
  Flag, 
  Trophy, 
  Newspaper, 
  Video, 
  Rss, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/adminpanel') return pathname === '/adminpanel';
    return pathname.startsWith(path);
  };

  const navItemClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
      active
        ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-400 border-l-4 border-orange-500 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;
  };

  return (
    <aside className="w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col shadow-2xl z-20 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
            Z
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 bg-clip-text text-transparent italic tracking-tighter">
              ZAPSCORE
            </h1>
            <p className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">
              Central de Comando
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Seção Visão Geral */}
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Visão Geral
          </p>
          <div className="space-y-1">
            <Link href="/adminpanel" className={navItemClass('/adminpanel')}>
              <div className="flex items-center space-x-3">
                <LayoutDashboard size={18} className={isActive('/adminpanel') ? 'text-orange-400' : 'text-slate-400'} />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link href="/adminpanel/sentinel" className={navItemClass('/adminpanel/sentinel')}>
              <div className="flex items-center space-x-3">
                <ShieldCheck size={18} className={isActive('/adminpanel/sentinel') ? 'text-emerald-400' : 'text-slate-400'} />
                <span>Monitor Sentinela</span>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ativo
              </span>
            </Link>
          </div>
        </div>

        {/* Seção Módulos Regionais */}
        <div>
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Ecossistemas & Módulos
            </p>
            <Sparkles size={11} className="text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            {ECOSYSTEM_MODULES.map((module) => {
              const IconComp = module.icon;
              const active = isActive(module.href);
              return (
                <Link key={module.id} href={module.href} className={navItemClass(module.href)}>
                  <div className="flex items-center space-x-3">
                    <IconComp size={18} className={active ? 'text-orange-400' : 'text-slate-400'} />
                    <span>{module.shortName}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${module.badgeColor}`}>
                    {module.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Seção Conteúdo Global */}
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Gestão de Conteúdo
          </p>
          <div className="space-y-1">
            <Link href="/adminpanel/news" className={navItemClass('/adminpanel/news')}>
              <div className="flex items-center space-x-3">
                <Newspaper size={18} className={isActive('/adminpanel/news') && !isActive('/adminpanel/news/sources') ? 'text-orange-400' : 'text-slate-400'} />
                <span>Notícias</span>
              </div>
            </Link>

            <Link href="/adminpanel/news/sources" className={navItemClass('/adminpanel/news/sources')}>
              <div className="flex items-center space-x-3">
                <Rss size={18} className={isActive('/adminpanel/news/sources') ? 'text-orange-400' : 'text-slate-400'} />
                <span>Fontes RSS</span>
              </div>
            </Link>

            <Link href="/adminpanel/videos" className={navItemClass('/adminpanel/videos')}>
              <div className="flex items-center space-x-3">
                <Video size={18} className={isActive('/adminpanel/videos') ? 'text-orange-400' : 'text-slate-400'} />
                <span>Vídeos</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>ZapScore Platform</span>
          <span className="font-mono text-slate-400">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
