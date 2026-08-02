import React from 'react';
import Link from 'next/link';
import { Globe, Database, ShieldCheck, Activity, ChevronRight, Zap } from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function EuropaModulePage() {
  const europaModule = ECOSYSTEM_MODULES.find((m) => m.id === 'europa');

  return (
    <div className="space-y-8">
      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Globe size={28} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-black tracking-tight text-white">Módulo Europa</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PocketBase Active
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Gerenciador Central da Suíte de Aplicativos Europa (Bundesliga, La Liga, Premier League, etc.)
            </p>
          </div>
        </div>

        {/* Quick Connection Info */}
        <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <Database size={20} className="text-emerald-400" />
          <div className="text-xs">
            <p className="text-slate-400 font-semibold">Instância PocketBase</p>
            <p className="text-slate-200 font-mono font-bold truncate max-w-[200px]">
              zapscore-pocketbase-europa
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Ligas Europeias Registradas */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <span>Competições Européias Cobertas</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
            {europaModule?.leagues.length} Ligas
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {europaModule?.leagues.map((league) => (
            <div
              key={league.id}
              className="bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{league.flag}</span>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{league.country}</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400">
                  ID: {league.id}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <Zap size={13} />
                  <span className="font-semibold">FCM Sync Habilitado</span>
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-500 group-hover:text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
