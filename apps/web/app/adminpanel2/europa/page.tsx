'use client';

import React from 'react';
import { Globe2, Server, Zap, ChevronRight, ShieldCheck, Trophy, Layers } from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function EuropaModulePage2() {
  const europaModule = ECOSYSTEM_MODULES.find((m) => m.id === 'europa');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <span>Módulos Ligas</span>
            <span>/</span>
            <span className="text-gray-400">Módulo Europa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Módulo Europa</span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg uppercase tracking-wider">
              PocketBase Active
            </span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Gerenciador das 5 ligas europeias (Bundesliga, La Liga, Premier League, Ligue 1, Serie A Itália).
          </p>
        </div>

        <div className="bg-[#111827] border border-gray-800 p-3 rounded-xl flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Server size={18} />
          </div>
          <div className="text-xs">
            <p className="text-gray-400 font-semibold">Instância DB</p>
            <p className="text-emerald-400 font-mono font-bold">zapscore-pocketbase-europa</p>
          </div>
        </div>
      </div>

      {/* Grid of Leagues */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <span>Competições Europeias Cobertas ({europaModule?.leagues.length || 5})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {europaModule?.leagues.map((league) => (
            <div
              key={league.id}
              className="bg-[#111827] border border-gray-800 hover:border-blue-500/50 p-5 rounded-2xl transition-all shadow-lg group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-2xl shrink-0">
                    {league.flag}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      {league.name}
                    </h4>
                    <p className="text-xs text-gray-400">{league.country}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                  ID: {league.id}
                </span>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <Zap size={13} />
                  <span>FCM Push Ativo</span>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
