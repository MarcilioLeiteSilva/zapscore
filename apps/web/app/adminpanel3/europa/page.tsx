'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, Newspaper, Video, Trophy, ExternalLink } from 'lucide-react';
import { EUROPEAN_LEAGUES } from '../registry';

export default function Admin3EuropaPage() {
  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Header com Navegação */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/adminpanel3"
              className="p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Dashboard</span>
            </Link>
            <span className="badge badge-ft text-[10px]">5 COMPETIÇÕES ATIVAS</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            <Globe className="text-[var(--primary)]" size={32} />
            <span>Módulo Europa — Ligas Principais</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 max-w-2xl">
            Selecione uma competição europeia para gerenciar notícias, vídeos, destaques e artilharia.
          </p>
        </div>
      </div>

      {/* Grid das 5 Ligas Europeias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {EUROPEAN_LEAGUES.map((league) => (
          <Link
            key={league.id}
            href={`/adminpanel3/europa/${league.id}`}
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            className="card p-6 rounded-2xl border hover:border-[var(--primary)] transition-all group flex flex-col justify-between space-y-6 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] p-2 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <img src={league.logo} alt={league.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-[var(--primary)] transition-colors">
                      {league.name}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] font-semibold">{league.country}</p>
                  </div>
                </div>
                <span className="badge badge-live text-[10px]">ID: {league.id}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                  <Newspaper size={16} className="mx-auto mb-1 text-[var(--primary)]" />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Notícias</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                  <Video size={16} className="mx-auto mb-1 text-red-400" />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Vídeos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                  <Trophy size={16} className="mx-auto mb-1 text-amber-400" />
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Artilharia</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--text-muted)] group-hover:text-white transition-colors">
              <span>Acessar Painel da Liga</span>
              <ExternalLink size={16} className="group-hover:text-[var(--primary)] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
