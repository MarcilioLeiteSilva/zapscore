import React from 'react';
import { Globe, Database, Zap, ChevronRight, Server, ShieldCheck } from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../registry';

export default function EuropaModulePage() {
  const europaModule = ECOSYSTEM_MODULES.find((m) => m.id === 'europa');

  return (
    <div className="space-y-8">
      {/* Banner Principal do Módulo Europa */}
      <div className="card glass relative overflow-hidden p-8 border border-[var(--glass-border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Globe size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Módulo Europa
                </h1>
                <span className="badge badge-ft">
                  PocketBase Active
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-sm mt-1 max-w-2xl">
                Gerenciador Central da Suíte de Aplicativos Europa (Bundesliga, La Liga, Premier League, Ligue 1, Serie A Itália).
              </p>
            </div>
          </div>

          {/* Card da Instância DB */}
          <div className="glass p-4 rounded-2xl border border-[var(--border)] flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server size={20} />
            </div>
            <div className="text-xs">
              <p className="text-[var(--text-muted)] font-semibold">Instância PocketBase</p>
              <p className="text-emerald-400 font-mono font-bold">
                zapscore-pocketbase-europa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Ligas Cobertas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span>Competições Europeias</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
              {europaModule?.leagues.length || 5} Ligas
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {europaModule?.leagues.map((league) => (
            <div
              key={league.id}
              className="card group hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-2xl shrink-0">
                    {league.flag}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">{league.country}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                  ID: {league.id}
                </span>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <Zap size={13} />
                  <span>FCM Sync Habilitado</span>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
