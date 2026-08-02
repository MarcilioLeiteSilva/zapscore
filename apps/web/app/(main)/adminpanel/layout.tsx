'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Globe, 
  ShieldCheck, 
  Newspaper, 
  Rss, 
  Video, 
  Activity,
  Database
} from 'lucide-react';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/adminpanel') return pathname === '/adminpanel';
    return pathname.startsWith(path);
  };

  const navTabs = [
    { name: 'Dashboard', path: '/adminpanel', icon: LayoutDashboard },
    { name: 'Módulo Europa', path: '/adminpanel/europa', icon: Globe, badge: 'PocketBase' },
    { name: 'Sentinela', path: '/adminpanel/sentinel', icon: ShieldCheck, badge: 'Live' },
    { name: 'Notícias', path: '/adminpanel/news', icon: Newspaper },
    { name: 'Fontes RSS', path: '/adminpanel/news/sources', icon: Rss },
    { name: 'Vídeos', path: '/adminpanel/videos', icon: Video },
  ];

  return (
    <div className="container py-8">
      {/* Sub-Header / Admin Navigation Bar */}
      <div className="glass p-3 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--glass-border)] shadow-xl">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)] scale-[1.02]'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-hover)]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-black rounded-full uppercase ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status Indicators */}
        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>PB Europa</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Activity size={13} className="animate-spin" />
            <span>API Online</span>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="fade-in">
        {children}
      </div>
    </div>
  );
}
