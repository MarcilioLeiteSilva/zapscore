'use client';

import React from 'react';
import Admin3Header from './components/Admin3Header';
import Admin3Sidebar from './components/Admin3Sidebar';

export default function Admin3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#020205] text-slate-100 font-sans antialiased">
      {/* Header Dedicado do Admin 3.0 (90% Largura com 5% de Margem) */}
      <Admin3Header />

      {/* Conteúdo Principal com 90% de Largura e 5% de Margem em Ambos os Lados */}
      <main className="flex-1 w-[90%] mx-auto py-8">
        <div className="flex gap-8 items-start w-full min-h-[calc(100vh-160px)]">
          {/* Menu Lateral Retrátil com Divisores e 90% Sync */}
          <Admin3Sidebar />

          {/* Área de Conteúdo Flexível */}
          <div className="flex-1 min-w-0 fade-in space-y-8">
            {children}
          </div>
        </div>
      </main>

      {/* Rodapé Alinhado ao Container de 90% */}
      <footer className="w-full border-t border-[var(--border)] py-6 mt-12 bg-black/40">
        <div className="w-[90%] mx-auto text-center text-xs font-semibold text-[var(--text-muted)]">
          ZapScore Admin 3.0 &copy; 2026 — Central de Comando Independente
        </div>
      </footer>
    </div>
  );
}
