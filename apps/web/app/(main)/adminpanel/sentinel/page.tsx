"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Activity,
  Calendar,
  Flame,
  Wrench,
  RefreshCw,
  PlayCircle,
  Zap,
  RotateCw,
  Wifi,
  Terminal,
  Key,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from "lucide-react";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function SentinelAdminPage() {
  const [apiKey, setApiKey] = useState("dev-api-key-123");
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; isError?: boolean }>>([
    { time: new Date().toLocaleTimeString(), text: "Monitor Sentinela ativado. Conectando à API de Produção..." },
  ]);

  const addLog = (text: string, isError = false) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text, isError }]);
  };

  const fetchSentinelData = async () => {
    setLoading(true);
    addLog("Atualizando estado do Sentinela e lista de jogos...");

    // 1. Health check público do Sentinela
    try {
      const res = await fetch(`${API_URL}/sentinel/health-check`);
      if (!res.ok) {
        if (res.status === 404) {
          setSystemHealth({ status: "AGUARDANDO DEPLOY", error: "Build da nova versão da API em andamento no Easypanel" });
          addLog("Deploy da nova versão da API em andamento no Easypanel (/sentinel/health-check ainda sendo publicado).", false);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } else {
        const health = await res.json();
        setSystemHealth(health);
        addLog(`Status de Integridade: ${health.status || "HEALTHY"}`);
      }
    } catch (err: any) {
      setSystemHealth({ status: "BUILDING", error: err.message });
      addLog(`Conexão com servidor em atualização no Easypanel...`, true);
    }

    // 2. Fixtures de Hoje no ZapScore (GET público)
    try {
      const res = await fetch(`${API_URL}/fixtures/today?leagueId=71`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFixtures(list);
      addLog(`Partidas da Série A encontradas para hoje: ${list.length}`);
    } catch (err: any) {
      addLog(`Erro ao carregar partidas de hoje: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const triggerAction = async (endpoint: string, label: string) => {
    addLog(`Disparando ação: ${label} (${endpoint})...`);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      addLog(`Resultado de ${label}: ${JSON.stringify(data)}`);
      alert(`Ação executada com sucesso!\n\n${JSON.stringify(data, null, 2)}`);
      fetchSentinelData();
    } catch (err: any) {
      addLog(`Falha na ação ${label}: ${err.message}`, true);
      alert(`Erro ao executar ação: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchSentinelData();
    const interval = setInterval(fetchSentinelData, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveMatchesCount = fixtures.filter(f =>
    ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].includes(f.statusShort)
  ).length;

  return (
    <div className="p-8 md:p-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Monitor Sentinela
            </h1>
            <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/30 tracking-widest uppercase flex items-center space-x-1.5">
              <Radio size={14} className="animate-pulse" />
              <span>AUDITORIA ATIVA</span>
            </span>
          </div>
          <p className="text-slate-400 font-medium mt-2">
            Supervisão autônoma em tempo real, consistência de fusos e autocorreção de partidas.
          </p>
        </div>

        {/* Chave API & Refresh */}
        <div className="glass p-3 rounded-2xl border border-[var(--border)] shadow-xl flex items-center space-x-3">
          <Key size={16} className="text-amber-400" />
          <input
            type="password"
            placeholder="Chave API Admin..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="bg-[var(--surface-hover)] text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 w-44 font-mono border border-[var(--border)]"
          />
          <button
            onClick={fetchSentinelData}
            disabled={loading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            title="Atualizar Dados"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Health */}
        <div className="card glass">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Status do Sistema
            </span>
            <Activity className={systemHealth?.status === "HEALTHY" ? "text-emerald-400" : "text-red-500"} size={22} />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            {systemHealth?.status === "HEALTHY" ? (
              <CheckCircle2 className="text-emerald-400" size={24} />
            ) : (
              <AlertTriangle className="text-red-500" size={24} />
            )}
            <h3 className={`text-2xl font-black uppercase ${systemHealth?.status === "HEALTHY" ? "text-emerald-400" : "text-red-500"}`}>
              {systemHealth?.status || "CARREGANDO"}
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
            {systemHealth?.timezoneAudit?.todayDate ? `Fuso: ${systemHealth.timezoneAudit.todayDate}` : "Auditoria operando"}
          </p>
        </div>

        {/* Today's Fixtures */}
        <div className="card glass">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Jogos de Hoje
            </span>
            <Calendar className="text-amber-400" size={22} />
          </div>
          <h3 className="text-3xl font-black text-white mt-4">{fixtures.length} Partidas</h3>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Fuso: America/Sao_Paulo</p>
        </div>

        {/* Live Matches */}
        <div className="card glass">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Partidas Ao Vivo
            </span>
            <Flame className="text-[var(--primary)]" size={22} />
          </div>
          <h3 className="text-3xl font-black text-[var(--primary)] mt-4">{liveMatchesCount} Ao Vivo</h3>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Sincronia contínua</p>
        </div>

        {/* Auto Heals */}
        <div className="card glass">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Autocorreções
            </span>
            <Wrench className="text-blue-400" size={22} />
          </div>
          <h3 className="text-3xl font-black text-blue-400 mt-4">Ativas</h3>
          <p className="text-xs text-slate-500 mt-2 font-medium">Auto-healing ativado</p>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="text-emerald-400" size={24} />
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
            Ações de Emergência e Manutenção
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => triggerAction("/sentinel/audit", "Auditoria Sentinela")}
            className="p-5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
          >
            <PlayCircle size={18} />
            <span>Auditar Agora</span>
          </button>

          <button
            onClick={() => triggerAction("/sync/live", "Sync Ao Vivo")}
            className="p-5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
          >
            <Zap size={18} />
            <span>Forçar Sync Ao Vivo</span>
          </button>

          <button
            onClick={() => triggerAction("/sync/today", "Sync de Hoje")}
            className="p-5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
          >
            <RotateCw size={18} />
            <span>Forçar Sync de Hoje</span>
          </button>

          <button
            onClick={() => triggerAction("/sync/test-connection", "Teste API-Football")}
            className="p-5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
          >
            <Wifi size={18} />
            <span>Testar API-Football</span>
          </button>
        </div>
      </div>

      {/* Fixtures Matrix */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Flame className="text-orange-500" size={22} />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
              Partidas Cadastradas para Hoje no ZapScore
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {fixtures.length} Partidas Encontradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="p-6">Confronto</th>
                <th className="p-6">Competição</th>
                <th className="p-6">Status ZapScore</th>
                <th className="p-6">Placar</th>
                <th className="p-6 text-right">Horário (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fixtures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 font-bold">
                    Nenhuma partida cadastrada para hoje.
                  </td>
                </tr>
              ) : (
                fixtures.map((f, idx) => {
                  const home = f.homeTeam?.name || f.homeTeamId || "Time A";
                  const away = f.awayTeam?.name || f.awayTeamId || "Time B";
                  const isLive = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].includes(f.statusShort);

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-6 font-bold text-white text-base">
                        {home} <span className="text-slate-500 font-normal">vs</span> {away}
                      </td>
                      <td className="p-6 text-slate-400 text-xs font-semibold">
                        {f.league?.name || "Série A"}
                      </td>
                      <td className="p-6">
                        {isLive ? (
                          <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-black text-xs animate-pulse">
                            {f.statusShort} (AO VIVO)
                          </span>
                        ) : (
                          <span className="px-3.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-bold text-xs">
                            {f.statusShort}
                          </span>
                        )}
                      </td>
                      <td className="p-6 font-black text-amber-400 text-xl">
                        {f.homeGoals ?? 0} x {f.awayGoals ?? 0}
                      </td>
                      <td className="p-6 text-right text-xs font-mono text-slate-400">
                        {f.date || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Terminal className="text-emerald-400" size={20} />
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight">
              Console de Eventos do Sentinela
            </h4>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            Limpar Console
          </button>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs max-h-56 overflow-y-auto space-y-2">
          {logs.map((log, i) => (
            <div key={i} className={log.isError ? "text-red-400" : "text-emerald-400"}>
              <span className="text-slate-600">[{log.time}]</span> {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
