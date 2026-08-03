'use client';

import React from 'react';
import Link from 'next/link';
import { Rss, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Admin3NewsSourcesPage() {
  const sources = [
    { name: 'GE - Globo Esporte', category: 'Futebol Brasileiro & Internacional', type: 'RSS Feed XML', status: 'Ativo' },
    { name: 'Kicker Online', category: 'Bundesliga & Futebol Alemão', type: 'RSS Feed XML', status: 'Ativo' },
    { name: 'Marca Esportes', category: 'La Liga & Futebol Espanhol', type: 'RSS Feed XML', status: 'Ativo' },
    { name: 'Sky Sports News', category: 'Premier League & Futebol Inglês', type: 'RSS Feed XML', status: 'Ativo' },
    { name: 'L`Équipe', category: 'Ligue 1 & Futebol Francês', type: 'RSS Feed XML', status: 'Ativo' },
    { name: 'Gazzetta dello Sport', category: 'Serie A & Futebol Italiano', type: 'RSS Feed XML', status: 'Ativo' },
  ];

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
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
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            <Rss className="text-[var(--primary)]" size={32} />
            <span>Fontes de RSS & Scrapers</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Conectores de inteligência que alimentam notícias no ZapScore.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src, i) => (
          <div key={i} className="card p-5 space-y-4 border border-[var(--border)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Rss size={18} className="text-orange-400" />
                <h3 className="font-bold text-white text-base">{src.name}</h3>
              </div>
              <span className="badge badge-ft text-[10px] flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>{src.status}</span>
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)]">{src.category}</p>

            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>Tipo: {src.type}</span>
              <span className="text-emerald-400 font-bold">Auto Sync</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
