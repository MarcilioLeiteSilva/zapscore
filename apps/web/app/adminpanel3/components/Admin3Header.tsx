'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Activity } from 'lucide-react';

export default function Admin3Header() {
  return (
    <header className="w-full border-b border-[var(--border)] bg-[#020205]/95 backdrop-blur-xl sticky top-0 z-50 py-3.5">
      <div className="w-[90%] mx-auto flex items-center justify-between">
        {/* Logo AdminPanel3 */}
        <Link href="/adminpanel3" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-black font-black shadow-lg shadow-[var(--primary-glow)] group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black italic tracking-tight text-white">
                ZAP<span className="text-[var(--primary)]">SCORE</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                v3.0 ADMIN
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-semibold tracking-wider uppercase">
              Central de Comando & Gestão
            </p>
          </div>
        </Link>

        {/* Status da API & Nav Rápida */}
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API PRODUÇÃO ONLINE</span>
          </div>

          <Link
            href="/adminpanel3/sentinel"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--surface-hover)] border border-[var(--border)] text-white hover:border-emerald-400 hover:text-emerald-400 transition-all"
          >
            <Activity size={15} className="text-emerald-400" />
            <span>Sentinela</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
