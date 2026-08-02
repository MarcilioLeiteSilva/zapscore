'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ChevronRight, 
  ExternalLink, 
  LogOut, 
  Activity, 
  Menu, 
  X,
  Server
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

export default function AppHeader() {
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const pathSegments = pathname
    .split("/")
    .filter((segment) => segment && segment !== "adminpanel");

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
      {/* Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={handleToggle}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 shrink-0"
          aria-label="Toggle Sidebar"
        >
          {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="flex items-center space-x-2 text-xs min-w-0">
          <Link
            href="/adminpanel"
            className="text-slate-400 hover:text-white font-bold transition-colors shrink-0"
          >
            Admin
          </Link>
          {pathSegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={13} className="text-slate-600 shrink-0" />
              <span className="capitalize text-orange-400 font-bold tracking-wide truncate">
                {segment.replace(/-/g, " ")}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Badges de Conexão & Ações Rápidas */}
      <div className="flex items-center space-x-3 text-xs shrink-0">
        {/* Status PocketBase */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>PocketBase Europa</span>
        </div>

        {/* Status API */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-[11px]">
          <Activity size={12} className="animate-spin text-amber-400" />
          <span>ZapScore API</span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

        {/* Voltar ao Site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-all border border-slate-700/60 text-xs"
        >
          <span>Ver Site</span>
          <ExternalLink size={12} />
        </Link>

        {/* Logout */}
        <Link
          href="/admin/login"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all border border-red-500/20 text-xs"
        >
          <LogOut size={12} />
          <span className="hidden sm:inline">Sair</span>
        </Link>
      </div>
    </header>
  );
}
