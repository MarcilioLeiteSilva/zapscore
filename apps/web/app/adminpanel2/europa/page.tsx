'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, ArrowLeft, Newspaper, Video, Trophy, ExternalLink, ShieldCheck } from 'lucide-react';
import { EUROPEAN_LEAGUES } from '../registry';

export default function EuropaModulePage2() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', fontFamily: 'var(--font-outfit)' }}>
      {/* Header Gradiente Estilo /competitions */}
      <div 
        className="card glass" 
        style={{ 
          padding: '2.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem', 
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255, 31, 31, 0.05) 100%)',
          borderRadius: '24px'
        }}
      >
        <div 
          style={{ 
            width: '90px', 
            height: '90px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '3rem', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            border: '1px solid var(--glass-border)'
          }}
        >
          🌍
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/adminpanel2"
              className="p-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </Link>
            <span className="badge badge-ft text-[10px]" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--success)', fontWeight: '800' }}>
              5 COMPETIÇÕES ATIVAS
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '900', color: 'white' }}>
            Módulo Europa — Ligas Principais
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--success)' }}>● SINCRONIA ATIVA</span>
            <span>•</span>
            <span>BUNDESLIGA, LA LIGA, PREMIER LEAGUE, SERIE A & LIGUE 1</span>
          </div>
        </div>
      </div>

      {/* Grid de 5 Ligas com Grid Fluido minmax(380px, 1fr) e gap: 2rem */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Trophy size={22} className="text-amber-400" />
            <span>Selecione a Competição para Gerenciar</span>
          </h2>
          <span className="badge badge-ft text-[10px]">POCKETBASE SYNC</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {EUROPEAN_LEAGUES.map((league) => (
            <Link
              key={league.id}
              href={`/adminpanel2/europa/${league.id}`}
              className="card p-6 group hover:border-[var(--primary)] transition-all flex flex-col justify-between space-y-6 shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] p-2 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <img src={league.logo} alt={league.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-[var(--primary)] transition-colors">
                        {league.name}
                      </h3>
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
    </div>
  );
}
