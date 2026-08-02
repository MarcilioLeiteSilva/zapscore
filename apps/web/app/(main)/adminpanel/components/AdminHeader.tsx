'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ExternalLink, LogOut, Activity, Database } from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();

  // Generates clean breadcrumb items from path
  const pathSegments = pathname
    .split('/')
    .filter((segment) => segment && segment !== 'adminpanel');

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Breadcrumb & Path */}
      <div className="flex items-center space-x-2 text-xs">
        <Link 
          href="/adminpanel" 
          className="text-slate-400 hover:text-white font-bold transition-colors flex items-center gap-1"
        >
          <span>Admin</span>
        </Link>
        {pathSegments.map((segment, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="capitalize text-orange-400 font-bold tracking-wide">
              {segment.replace(/-/g, ' ')}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Connection Badges & Quick Controls */}
      <div className="flex items-center space-x-4">
        {/* Status PocketBase */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>PocketBase Europa</span>
        </div>

        {/* Status API */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Activity size={12} className="animate-spin" />
          <span>ZapScore API</span>
        </div>

        <div className="h-4 w-px bg-slate-800"></div>

        {/* Voltar ao Site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700/50"
        >
          <span>Ver Site</span>
          <ExternalLink size={13} />
        </Link>

        {/* Logout */}
        <Link
          href="/admin/login"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all border border-red-500/20"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sair</span>
        </Link>
      </div>
    </header>
  );
}
