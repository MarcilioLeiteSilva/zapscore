'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Newspaper, 
  Rss, 
  Video, 
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../../(main)/adminpanel/registry';

export default function Admin3Sidebar({
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
    if (path === '/adminpanel3') return pathname === '/adminpanel3';
    return pathname.startsWith(path);
  };

  return (
    <aside
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        fontFamily: 'var(--font-outfit)',
      }}
      className={`border rounded-2xl p-4 flex flex-col h-fit transition-all duration-300 ease-in-out shrink-0 select-none shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div 
        style={{ borderColor: 'var(--border)' }}
        className="pb-4 mb-4 border-b flex items-center justify-between shrink-0"
      >
        {!isCollapsed && (
          <span 
            style={{ color: 'var(--primary)' }}
            className="text-xs font-black tracking-widest uppercase italic"
          >
            Menu Admin 3.0
          </span>
        )}

        <button
          onClick={handleToggle}
          style={{ 
            background: 'var(--surface-hover)', 
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
          className={`p-2.5 rounded-xl border hover:text-white hover:border-[var(--primary)] transition-all ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expandir Menu' : 'Retrair Menu'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-6">
        {/* Visão Geral */}
        <div>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
              Visão Geral
            </p>
          )}
          <div className="space-y-2">
            <Link
              href="/adminpanel3"
              style={{
                background: isActive('/adminpanel3') && pathname === '/adminpanel3' ? 'rgba(255, 31, 31, 0.15)' : 'transparent',
                borderColor: isActive('/adminpanel3') && pathname === '/adminpanel3' ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel3') && pathname === '/adminpanel3' ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border hover:text-white hover:bg-[var(--surface-hover)] ${
                isActive('/adminpanel3') && pathname === '/adminpanel3' ? 'border-l-4 border-l-[var(--primary)]' : ''
              } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutDashboard size={18} style={{ color: isActive('/adminpanel3') && pathname === '/adminpanel3' ? 'var(--primary)' : 'inherit' }} className="shrink-0" />
                {!isCollapsed && <span className="truncate">Dashboard</span>}
              </div>
            </Link>

            <Link
              href="/adminpanel3/sentinel"
              style={{
                background: isActive('/adminpanel3/sentinel') ? 'rgba(0, 255, 136, 0.12)' : 'transparent',
                borderColor: isActive('/adminpanel3/sentinel') ? 'var(--success)' : 'transparent',
                color: isActive('/adminpanel3/sentinel') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border hover:text-white hover:bg-[var(--surface-hover)] ${
                isActive('/adminpanel3/sentinel') ? 'border-l-4 border-l-emerald-400' : ''
              } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
              title={isCollapsed ? 'Monitor Sentinela' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
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
        <div className="border-t border-[var(--border)] pt-4">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Módulos Ligas
              </p>
              <Sparkles size={12} className="text-amber-400 animate-pulse" />
            </div>
          )}
          <div className="space-y-2">
            {ECOSYSTEM_MODULES.map((module) => {
              const IconComp = module.icon;
              const module3Href = module.href.replace('/adminpanel', '/adminpanel3');
              const active = isActive(module3Href);
              return (
                <Link
                  key={module.id}
                  href={module3Href}
                  style={{
                    background: active ? 'rgba(255, 31, 31, 0.15)' : 'transparent',
                    borderColor: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                  }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border hover:text-white hover:bg-[var(--surface-hover)] ${
                    active ? 'border-l-4 border-l-[var(--primary)]' : ''
                  } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
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
        <div className="border-t border-[var(--border)] pt-4">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
              Gestão Conteúdo
            </p>
          )}
          <div className="space-y-2">
            <Link
              href="/adminpanel3/news"
              style={{
                background: isActive('/adminpanel3/news') && !isActive('/adminpanel3/news/sources') ? 'rgba(255, 31, 31, 0.15)' : 'transparent',
                borderColor: isActive('/adminpanel3/news') && !isActive('/adminpanel3/news/sources') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel3/news') && !isActive('/adminpanel3/news/sources') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border hover:text-white hover:bg-[var(--surface-hover)] ${
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
              href="/adminpanel3/news/sources"
              style={{
                background: isActive('/adminpanel3/news/sources') ? 'rgba(255, 31, 31, 0.15)' : 'transparent',
                borderColor: isActive('/adminpanel3/news/sources') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel3/news/sources') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border hover:text-white hover:bg-[var(--surface-hover)] ${
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
              href="/adminpanel3/videos"
              style={{
                background: isActive('/adminpanel3/videos') ? 'rgba(255, 31, 31, 0.15)' : 'transparent',
                borderColor: isActive('/adminpanel3/videos') ? 'var(--primary)' : 'transparent',
                color: isActive('/adminpanel3/videos') ? '#ffffff' : 'var(--text-muted)',
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border hover:text-white hover:bg-[var(--surface-hover)] ${
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
        className="pt-4 mt-6 border-t flex items-center justify-between text-[10px] shrink-0 font-medium"
      >
        {!isCollapsed ? (
          <>
            <span>ZapScore Admin</span>
            <span className="font-mono text-white font-bold">v3.0.0</span>
          </>
        ) : (
          <span className="mx-auto font-mono text-white font-bold">v3.0</span>
        )}
      </div>
    </aside>
  );
}
