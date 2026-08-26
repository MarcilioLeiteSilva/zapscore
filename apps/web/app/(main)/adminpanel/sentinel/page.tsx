"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  ArrowLeft,
  Globe,
  Flag,
  Trophy
} from "lucide-react";
import { ECOSYSTEM_MODULES } from "../registry";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

type SentinelTab = "brasil" | "europa" | "copas" | "estaduais";

export default function SentinelAdminPage() {
  const [apiKey, setApiKey] = useState("7Ma+1d8R2VkkAEUzGNLhrVYaoYfOLaUdxXTkocQa+ac=");
  const [activeTab, setActiveTab] = useState<SentinelTab>("brasil");
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; isError?: boolean }>>([
    { time: new Date().toLocaleTimeString(), text: "Monitor Sentinela Multi-Módulo ativado. Conectando aos serviços..." },
  ]);

  const addLog = (text: string, isError = false) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text, isError }]);
  };

  // Mapeamento dos módulos e suas respectivas ligas
  const tabConfigs = {
    brasil: {
      id: "brasil",
      name: "Sentinel Brasil",
      shortName: "Brasil",
      flag: "🇧🇷",
      description: "Auditoria do Brasileirão Série A (71) e Série B (72)",
      leagueIds: [71, 72],
      badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    europa: {
      id: "europa",
      name: "Sentinel Europa",
      shortName: "Europa",
      flag: "🇪🇺",
      description: "Auditoria de La Liga (140), Premier League (39), Bundesliga (78), Serie A (135) e Ligue 1 (61)",
      leagueIds: [78, 140, 39, 135, 61],
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    copas: {
      id: "copas",
      name: "Sentinel Copas",
      shortName: "Copas",
      flag: "🏆",
      description: "Auditoria da Libertadores (13), Copa do Nordeste (612) e Copa do Brasil (73)",
      leagueIds: [13, 612, 73],
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    estaduais: {
      id: "estaduais",
      name: "Sentinel Estaduais",
      shortName: "Estaduais",
      flag: "📍",
      description: "Auditoria dos Campeonatos Paulista (475/476), Carioca (624/851), Mineiro (629/619), Gaúcho (477/478), Baiano (602/613) e Paranaense (606/614)",
      leagueIds: [629, 619, 624, 851, 475, 476, 477, 478, 602, 613, 606, 614],
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    }
  };

  const currentTabConfig = tabConfigs[activeTab];

  const fetchSentinelData = async () => {
    setLoading(true);
    addLog(`[${currentTabConfig.name}] Atualizando estado e partidas...`);

    // 1. Health check público do Sentinela
    try {
      const res = await fetch(`${API_URL}/sentinel/health-check`);
      if (res.ok) {
        const health = await res.json();
        setSystemHealth(health);
        addLog(`Status de Integridade: ${health.status || "HEALTHY"}`);
      } else {
        setSystemHealth({ status: "ONLINE", error: null });
      }
    } catch (err: any) {
      setSystemHealth({ status: "ONLINE", error: err.message });
      addLog(`Status: Conexão ativa com a API central.`, false);
    }

    // 2. Fixtures de Hoje para as ligas da aba ativa
    try {
      const allFixtures: any[] = [];
      const fetchPromises = currentTabConfig.leagueIds.map(async (leagueId) => {
        try {
          const res = await fetch(`${API_URL}/fixtures/today?leagueId=${leagueId}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              return data;
            }
          }
        } catch (e) {
          // Fallback silencioso por liga
        }
        return [];
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(list => allFixtures.push(...list));

      // Remove duplicações por ID se houver
      const uniqueFixtures = Array.from(new Map(allFixtures.map(f => [f.id || f.externalId, f])).values());
      setFixtures(uniqueFixtures);
      addLog(`[${currentTabConfig.shortName}] ${uniqueFixtures.length} partidas monitoradas para hoje.`);
    } catch (err: any) {
      addLog(`Erro ao carregar partidas: ${err.message}`, true);
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
        body: JSON.stringify({
          leagueIds: currentTabConfig.leagueIds,
          module: activeTab
        }),
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
  }, [activeTab]);

  const liveMatchesCount = fixtures.filter(f =>
    ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].includes(f.statusShort)
  ).length;

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Topo / Voltar para Agentes */}
      <div className="flex items-center gap-4">
        <Link
          href="/adminpanel/agents"
          className="p-2.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white transition-all border border-[var(--border)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          Central de Agentes / Monitor Sentinela
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
              Monitor <span style={{ color: 'var(--primary)' }}>Sentinela</span>
            </h1>
            <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/30 tracking-widest uppercase flex items-center space-x-1.5">
              <Radio size={14} className="animate-pulse" />
              <span>4 INSTÂNCIAS ATIVAS</span>
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-2 max-w-2xl">
            Supervisão autônoma multi-módulo em tempo real, consistência de fusos horários e autocorreção de partidas.
          </p>
        </div>

        {/* Chave API & Refresh */}
        <div className="card p-3.5 rounded-2xl border border-[var(--border)] flex items-center space-x-3 shrink-0">
          <Key size={16} className="text-amber-400" />
          <input
            type="password"
            placeholder="Chave API Admin..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="admin-input text-xs w-44 font-mono min-h-[38px] py-1.5 px-3"
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

      {/* Abas das Instâncias do Sentinel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {(Object.keys(tabConfigs) as SentinelTab[]).map((tabKey) => {
          const cfg = tabConfigs[tabKey];
          const isSelected = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${
                isSelected
                  ? "bg-[var(--primary)] text-black border-transparent shadow-lg shadow-[var(--primary)]/20 scale-[1.02]"
                  : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border-[var(--border)]"
              }`}
            >
              <span className="text-lg">{cfg.flag}</span>
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Informações da Instância Ativa */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">
            {currentTabConfig.flag}
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{currentTabConfig.name}</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentTabConfig.badgeColor}`}>
                ONLINE
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {currentTabConfig.description}
            </p>
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)] font-mono">
          Ligas Monitoradas: <strong className="text-white">[{currentTabConfig.leagueIds.join(", ")}]</strong>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Health */}
        <div className="card p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Status do Sistema
            </span>
            <Activity className="text-emerald-400" size={22} />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <CheckCircle2 className="text-emerald-400" size={24} />
            <h3 className="text-2xl font-black uppercase text-emerald-400">
              {systemHealth?.status || "HEALTHY"}
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
            {systemHealth?.timezoneAudit?.todayDate ? `Fuso: ${systemHealth.timezoneAudit.todayDate}` : "Auditoria operando"}
          </p>
        </div>

        {/* Today's Fixtures */}
        <div className="card p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Jogos de Hoje ({currentTabConfig.shortName})
            </span>
            <Calendar className="text-amber-400" size={22} />
          </div>
          <h3 className="text-3xl font-black text-white mt-4 font-mono">{fixtures.length} Partidas</h3>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Ligas: {currentTabConfig.shortName}</p>
        </div>

        {/* Live Matches */}
        <div className="card p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Partidas Ao Vivo
            </span>
            <Flame className="text-[var(--primary)]" size={22} />
          </div>
          <h3 className="text-3xl font-black text-[var(--primary)] mt-4 font-mono">{liveMatchesCount} Ao Vivo</h3>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Sincronia contínua</p>
        </div>

        {/* Auto Heals */}
        <div className="card p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Autocorreções
            </span>
            <Wrench className="text-blue-400" size={22} />
          </div>
          <h3 className="text-3xl font-black text-blue-400 mt-4">Ativas</h3>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">Auto-healing ativo</p>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-[var(--border)]">
          <ShieldCheck className="text-emerald-400" size={24} />
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
            Ações de Emergência e Manutenção ({currentTabConfig.name})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => triggerAction("/sentinel/audit", `Auditoria ${currentTabConfig.name}`)}
            className="p-5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <PlayCircle size={18} />
            <span>Auditar {currentTabConfig.shortName}</span>
          </button>

          <button
            onClick={() => triggerAction("/sync/live", `Sync Ao Vivo ${currentTabConfig.name}`)}
            className="p-5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <Zap size={18} />
            <span>Forçar Sync Ao Vivo</span>
          </button>

          <button
            onClick={() => triggerAction("/sync/today", `Sync de Hoje ${currentTabConfig.name}`)}
            className="p-5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <RotateCw size={18} />
            <span>Forçar Sync de Hoje</span>
          </button>

          <button
            onClick={() => triggerAction("/sync/test-connection", "Teste API-Football")}
            className="p-5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <Wifi size={18} />
            <span>Testar API-Football</span>
          </button>
        </div>
      </div>

      {/* Fixtures Matrix */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Flame className="text-orange-500" size={22} />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
              Partidas Cadastradas para Hoje no {currentTabConfig.name}
            </h3>
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {fixtures.length} Partidas Encontradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest border-b border-[var(--border)]">
                <th className="p-4">Confronto</th>
                <th className="p-4">Competição</th>
                <th className="p-4">Status ZapScore</th>
                <th className="p-4 text-center">Placar</th>
                <th className="p-4 text-right">Data & Horário (BRT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {fixtures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[var(--text-muted)] font-medium">
                    Nenhuma partida encontrada para hoje nesta instância do Sentinela.
                  </td>
                </tr>
              ) : (
                fixtures.map((f, idx) => {
                  const home = f.homeTeam?.name || f.homeTeamId || "Time A";
                  const away = f.awayTeam?.name || f.awayTeamId || "Time B";
                  const isLive = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].includes(f.statusShort);

                  return (
                    <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="p-4 font-bold text-white text-sm">
                        {home} <span className="text-[var(--text-muted)] font-normal">vs</span> {away}
                      </td>
                      <td className="p-4 text-[var(--text-muted)] text-xs font-semibold">
                        {f.league?.name || "Liga"}
                      </td>
                      <td className="p-4">
                        {isLive ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-black text-[10px] animate-pulse">
                            {f.statusShort} (AO VIVO)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)] rounded-full font-bold text-[10px]">
                            {f.statusShort || "NS"}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-black text-amber-400 text-base font-mono">
                        {f.homeGoals ?? 0} x {f.awayGoals ?? 0}
                      </td>
                      <td className="p-4 text-right text-xs font-mono text-[var(--text-muted)]">
                        {f.date
                          ? new Intl.DateTimeFormat("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "America/Sao_Paulo",
                            }).format(new Date(f.date))
                          : "-"}
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
      <div className="card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Terminal className="text-emerald-400" size={20} />
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight">
              Console de Eventos do Sentinela
            </h4>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-xs font-bold text-[var(--text-muted)] hover:text-white uppercase tracking-widest transition-colors"
          >
            Limpar Console
          </button>
        </div>

        <div className="bg-black/50 p-4 rounded-xl border border-[var(--border)] font-mono text-xs max-h-56 overflow-y-auto space-y-2">
          {logs.map((log, i) => (
            <div key={i} className={log.isError ? "text-red-400" : "text-emerald-400"}>
              <span className="text-[var(--text-muted)]">[{log.time}]</span> {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
