'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Globe, 
  ShieldCheck, 
  Newspaper, 
  Rss, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Flag,
  Trophy,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function ZapScoreAdminSidebar({
  onToggleCollapse,
}: {
  onToggleCollapse?: (collapsed: boolean) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggleCollapse) {
      onToggleCollapse(newState);
    }
  };

  const isActive = (path: string) => {
    if (path === '/adminpanel') return pathname === '/adminpanel';
    return pathname.startsWith(path);
  };

  const navItemClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
      active
        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)] scale-[1.01]'
        : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)]'
    } ${isCollapsed ? 'justify-center' : 'justify-between'}`;
  };

  return (
    <aside
      className={`bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header with Retract Button */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[var(--primary)] uppercase">
              Painel Admin
            </span>
          </div>
        )}

        <button
          onClick={handleToggle}
          className={`p-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary)] text-[var(--text-muted)] hover:text-white transition-all border border-[var(--border)] ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expandir Menu' : 'Retrair Menu'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Visão Geral */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Visão Geral
            </p>
          )}
          <div className="space-y-1">
            <Link
              href="/adminpanel"
              className={navItemClass('/adminpanel')}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutDashboard size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Dashboard</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/sentinel"
              className={navItemClass('/adminpanel/sentinel')}
              title={isCollapsed ? 'Monitor Sentinela' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
                {!isCollapsed && <span className="truncate">Sentinela</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Live
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Ecossistemas */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
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
                  className={navItemClass(module.href)}
                  title={isCollapsed ? module.name : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp size={18} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{module.shortName}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full border shrink-0 ${module.badgeColor}`}>
                      {module.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Gestão de Conteúdo */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Gestão Conteúdo
            </p>
          )}
          <div className="space-y-1">
            <Link
              href="/adminpanel/news"
              className={navItemClass('/adminpanel/news')}
              title={isCollapsed ? 'Notícias' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Newspaper size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Notícias</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/news/sources"
              className={navItemClass('/adminpanel/news/sources')}
              title={isCollapsed ? 'Fontes RSS' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Rss size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Fontes RSS</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/videos"
              className={navItemClass('/adminpanel/videos')}
              title={isCollapsed ? 'Vídeos' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Video size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Vídeos</span>}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[var(--border)] bg-black/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] shrink-0">
        {!isCollapsed ? (
          <>
            <span>ZapScore Platform</span>
            <span className="font-mono text-white font-bold">v2.4.0</span>
          </>
        ) : (
          <span className="mx-auto font-mono text-white font-bold">v2.4</span>
        )}
      </div>
    </aside>
  );
}
