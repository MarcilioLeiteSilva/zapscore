'use client';

import React from 'react';
import ZapScoreAdminSidebar from './components/ZapScoreAdminSidebar';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex gap-8 items-start min-h-[calc(100vh-140px)]">
      {/* Menu Lateral Retrátil com Espaçamento Harmônico */}
      <ZapScoreAdminSidebar />

      {/* Área de Conteúdo Principal (Com Espaçamento Lateral e Vertical Elegante) */}
      <div className="flex-1 min-w-0 fade-in space-y-8">
        {children}
      </div>
    </div>
  );
}
