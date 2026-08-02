import React from 'react';
import { Globe, Database, Zap, ChevronRight, Activity, Server } from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function EuropaModulePage() {
  const europaModule = ECOSYSTEM_MODULES.find((m) => m.id === 'europa');

  return (
    <div className="space-y-8">
      {/* Banner de Topo do Módulo */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Globe size={24} />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Módulo Europa
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PocketBase Active
                </span>
              </div>
              <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl">
                Gerenciador Central da Suíte de Aplicativos Europa (Bundesliga, La Liga, Premier League, Ligue 1, Serie A Itália).
              </p>
            </div>
          </div>

          {/* Card de Instância DB */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-emerald-400">
              <Server size={18} />
            </div>
            <div className="text-xs">
              <p className="text-slate-400 font-semibold">Instância PocketBase</p>
              <p className="text-emerald-400 font-mono font-bold text-xs truncate">
                zapscore-pocketbase-europa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Ligas Cobertas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Competições Europeias</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
              {europaModule?.leagues.length || 5} Ligas
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {europaModule?.leagues.map((league) => (
            <div
              key={league.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5 group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-lg font-bold text-slate-300">
                    {league.flag}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{league.country}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                  ID: {league.id}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                  <Zap size={13} />
                  <span>FCM Sync Habilitado</span>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
