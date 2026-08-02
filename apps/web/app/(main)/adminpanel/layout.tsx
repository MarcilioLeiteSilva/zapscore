'use client';

import React from 'react';
import ZapScoreAdminSidebar from './components/ZapScoreAdminSidebar';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Menu Lateral Retrátil com a Identidade Visual Nativa ZapScore */}
      <ZapScoreAdminSidebar />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 p-6 md:p-8 min-w-0 fade-in">
        {children}
      </div>
    </div>
  );
}
