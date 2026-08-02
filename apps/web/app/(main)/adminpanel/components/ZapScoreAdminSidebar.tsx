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
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Activity
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

  return (
    <aside
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        fontFamily: 'var(--font-outfit)',
      }}
      className={`border-r flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header with Retract Button */}
      <div 
        style={{ borderColor: 'var(--border)' }}
        className="p-4 border-b flex items-center justify-between shrink-0"
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span 
              style={{ color: 'var(--primary)' }}
              className="text-xs font-black tracking-wider uppercase"
            >
              Menu Admin
            </span>
          </div>
        )}

        <button
          onClick={handleToggle}
          style={{ 
            background: 'var(--surface-hover)', 
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
          className="p-2 rounded-xl border hover:text-white hover:border-[var(--primary)] transition-all"
          title={isCollapsed ? 'Expandir Menu' : 'Retrair Menu'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Visão Geral */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
              Visão Geral
            </p>
          )}
          <div className="space-y-1">
            <Link
              href="/adminpanel"
              style={{
                background: isActive('/adminpanel') ? 'rgba(255, 31, 31, 0.12)' : 'transparent',
                borderColor: isActive('/adminpanel') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-2 hover:text-white hover:bg-[var(--surface-hover)] ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutDashboard size={18} style={{ color: isActive('/adminpanel') ? 'var(--primary)' : 'inherit' }} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Dashboard</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/sentinel"
              style={{
                background: isActive('/adminpanel/sentinel') ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                borderColor: isActive('/adminpanel/sentinel') ? 'var(--success)' : 'transparent',
                color: isActive('/adminpanel/sentinel') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-2 hover:text-white hover:bg-[var(--surface-hover)] ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
              title={isCollapsed ? 'Monitor Sentinela' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck size={18} className="shrink-0 style={{ color: 'var(--success)' }}" />
                {!isCollapsed && <span className="truncate">Sentinela</span>}
              </div>
              {!isCollapsed && (
                <span className="badge badge-ft text-[9px] px-2 py-0.5 font-bold shrink-0">
                  ONLINE
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Ecossistemas */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
                  style={{
                    background: active ? 'rgba(255, 31, 31, 0.12)' : 'transparent',
                    borderColor: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-2 hover:text-white hover:bg-[var(--surface-hover)] ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between'
                  }`}
                  title={isCollapsed ? module.name : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp size={18} style={{ color: active ? 'var(--primary)' : 'inherit' }} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{module.shortName}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="badge badge-ft text-[9px] px-2 py-0.5 font-bold shrink-0">
                      ONLINE
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
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
              Gestão Conteúdo
            </p>
          )}
          <div className="space-y-1">
            <Link
              href="/adminpanel/news"
              style={{
                background: isActive('/adminpanel/news') && !isActive('/adminpanel/news/sources') ? 'rgba(255, 31, 31, 0.12)' : 'transparent',
                borderColor: isActive('/adminpanel/news') && !isActive('/adminpanel/news/sources') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel/news') && !isActive('/adminpanel/news/sources') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-2 hover:text-white hover:bg-[var(--surface-hover)] ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
              title={isCollapsed ? 'Notícias' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Newspaper size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Notícias</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/news/sources"
              style={{
                background: isActive('/adminpanel/news/sources') ? 'rgba(255, 31, 31, 0.12)' : 'transparent',
                borderColor: isActive('/adminpanel/news/sources') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel/news/sources') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-2 hover:text-white hover:bg-[var(--surface-hover)] ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
              title={isCollapsed ? 'Fontes RSS' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Rss size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Fontes RSS</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel/videos"
              style={{
                background: isActive('/adminpanel/videos') ? 'rgba(255, 31, 31, 0.12)' : 'transparent',
                borderColor: isActive('/adminpanel/videos') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel/videos') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border-l-2 hover:text-white hover:bg-[var(--surface-hover)] ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
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
      <div 
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        className="p-3 border-t flex items-center justify-between text-[10px] shrink-0 font-medium"
      >
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
