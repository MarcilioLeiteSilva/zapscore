"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flag, Zap, ChevronRight, Server, Trophy } from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function EstaduaisModulePage() {
  const router = useRouter();
  const estaduaisModule = ECOSYSTEM_MODULES.find((m) => m.id === 'estaduais');

  return (
    <div className="space-y-[30px]" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Header do Módulo Estaduais */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Módulo <span style={{ color: 'var(--primary)' }}>Estaduais</span>
            </h1>
            <span className="badge badge-ft">• ZAPSCORE API ACTIVE</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm mt-2 max-w-2xl">
            Gerenciador Central de Notícias, Vídeos e Artilharia dos Campeonatos Estaduais (Mineiro, Carioca, Paulista, Gaúcho, Baiano e Paranaense).
          </p>
        </div>

        {/* Card de Instância DB */}
        <div className="card p-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Server size={20} />
          </div>
          <div className="text-xs">
            <p className="text-[var(--text-muted)] font-semibold">Fonte de Dados</p>
            <p className="text-amber-400 font-mono font-bold">
              Zapscore API Central
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Campeonatos Estaduais Cobertos */}
      <div className="space-y-[30px]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Trophy size={20} className="text-amber-400" />
            <span>Campeonatos Estaduais Cobertos</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
              {estaduaisModule?.leagues.length || 6} Competições
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
          {estaduaisModule?.leagues.map((league) => (
            <Link
              key={league.id}
              href={`/adminpanel/estaduais/${league.id}`}
              onClick={() => router.push(`/adminpanel/estaduais/${league.id}`)}
              className="card group hover:border-[var(--primary)] transition-all duration-300 flex flex-col justify-between cursor-pointer block relative z-10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-2xl shrink-0">
                    {league.flag}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-[var(--primary)] transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">{league.country}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                  ID: {league.id}
                </span>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <Zap size={13} />
                  <span>Notícias • Vídeos • Artilharia</span>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
