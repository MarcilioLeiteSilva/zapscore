'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe2,
  ShieldAlert,
  Newspaper,
  Rss,
  Video,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Layers,
  Settings,
  Bell,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar2() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (path: string) => {
    if (path === '/adminpanel2') return pathname === '/adminpanel2';
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/adminpanel2', icon: LayoutDashboard, badge: null },
        { name: 'Sentinela', href: '/adminpanel2/sentinel', icon: ShieldAlert, badge: 'Live' },
      ],
    },
    {
      group: 'ECOSSISTEMAS',
      items: [
        { name: 'Módulo Europa', href: '/adminpanel2/europa', icon: Globe2, badge: 'PocketBase' },
        { name: 'Módulo Brasil', href: '/adminpanel2/brasil', icon: Layers, badge: 'Supabase' },
      ],
    },
    {
      group: 'CONTEÚDO',
      items: [
        { name: 'Notícias', href: '/adminpanel2/news', icon: Newspaper, badge: null },
        { name: 'Fontes RSS', href: '/adminpanel2/news/sources', icon: Rss, badge: null },
        { name: 'Vídeos Watch', href: '/adminpanel2/videos', icon: Video, badge: null },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#111827] border-r border-gray-800/80 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800/80 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25">
              <Zap size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white tracking-wide">
                ZapScore <span className="text-blue-500">Admin</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Control Center v2.4</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black mx-auto">
            <Zap size={18} />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors border border-gray-700/50 ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title="Retrair Sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navItems.map((group, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                {group.group}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 font-bold'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider shrink-0 ${
                        item.badge === 'Live'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Toggle when Collapsed */}
      <div className="p-3 border-t border-gray-800/80 bg-gray-900/40 shrink-0">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="w-full py-2 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Expandir Sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        ) : (
          <div className="flex items-center justify-between px-2 text-[11px] text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>API Connected</span>
            </div>
            <span className="font-mono text-xs font-bold text-gray-300">v2.4</span>
          </div>
        )}
      </div>
    </aside>
  );
}
