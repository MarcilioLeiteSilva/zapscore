'use client';

import React from 'react';
import { Search, Bell, ShieldCheck, User, Sparkles } from 'lucide-react';

export default function Navbar2() {
  return (
    <header className="h-16 border-b border-gray-800/80 bg-[#111827]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72 bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-1.5 focus-within:border-blue-500 transition-colors">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar no painel..."
          className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
        />
      </div>

      {/* Right Items */}
      <div className="flex items-center gap-5">
        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Produção Online</span>
        </div>

        {/* Notification Icon */}
        <button className="relative p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors border border-gray-700/50">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            AD
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-white">Admin Master</span>
            <span className="text-[10px] text-gray-400 font-medium">ZapScore Ops</span>
          </div>
        </div>
      </div>
    </header>
  );
}
