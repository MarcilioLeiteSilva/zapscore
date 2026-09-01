"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Send, 
  Sparkles, 
  Smartphone, 
  Trophy, 
  Newspaper, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Radio,
  Image as ImageIcon,
  Flame,
  FileText,
  Check,
  X,
  Edit3
} from 'lucide-react';
import { PushSimulator } from './components/PushSimulator';

interface CompetitionOption {
  id: number;
  name: string;
  slug: string;
  country: string;
  cluster: string;
}

const COMPETITIONS: CompetitionOption[] = [
  { id: 71, name: "Brasileirão Série A", slug: "brasileirao", country: "Brasil", cluster: "Brasil" },
  { id: 72, name: "Brasileirão Série B", slug: "brasileirao", country: "Brasil", cluster: "Brasil" },
  { id: 73, name: "Copa do Brasil", slug: "brasileirao", country: "Brasil", cluster: "Brasil" },
  { id: 475, name: "Campeonato Paulista A1", slug: "campeonato_paulista", country: "Brasil", cluster: "Estaduais" },
  { id: 476, name: "Campeonato Paulista A2", slug: "campeonato_paulista", country: "Brasil", cluster: "Estaduais" },
  { id: 624, name: "Campeonato Carioca", slug: "campeonato_carioca", country: "Brasil", cluster: "Estaduais" },
  { id: 629, name: "Campeonato Mineiro", slug: "campeonato_mineiro", country: "Brasil", cluster: "Estaduais" },
  { id: 477, name: "Campeonato Gaúcho", slug: "campeonato_gaucho", country: "Brasil", cluster: "Estaduais" },
  { id: 602, name: "Campeonato Baiano", slug: "campeonato_baiano", country: "Brasil", cluster: "Estaduais" },
  { id: 606, name: "Campeonato Paranaense", slug: "campeonato_paranaense", country: "Brasil", cluster: "Estaduais" },
  { id: 609, name: "Campeonato Cearense", slug: "campeonato_cearense", country: "Brasil", cluster: "Estaduais" },
  { id: 140, name: "La Liga (Espanha)", slug: "laliga", country: "Espanha", cluster: "Europa" },
  { id: 39, name: "Premier League (Inglaterra)", slug: "premierleague", country: "Inglaterra", cluster: "Europa" },
  { id: 78, name: "Bundesliga (Alemanha)", slug: "bundesliga", country: "Alemanha", cluster: "Europa" },
  { id: 135, name: "Serie A (Itália)", slug: "seriea-italia", country: "Itália", cluster: "Europa" },
  { id: 61, name: "Ligue 1 (França)", slug: "ligue1-franca", country: "França", cluster: "Europa" },
  { id: 2, name: "UEFA Champions League", slug: "champions_league", country: "Europa", cluster: "Europa" }
];

export default function PushAgentPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'round' | 'lineups' | 'history'>('round');
  const [selectedComp, setSelectedComp] = useState<CompetitionOption>(COMPETITIONS[0]);
  
  // Formulário Manual / Simulador
  const [title, setTitle] = useState("🔥 CLÁSSICO DECISIVO HOJE!");
  const [body, setBody] = useState("Bola rolando às 16h com transmissão ao vivo e minutagem lance a lance no app!");
  const [imageUrl, setImageUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Dashboard Global de Resumos de Rodadas (Sem dropdown)
  const [roundsDashboard, setRoundsDashboard] = useState<{
    completedLeagues: any[];
    inProgressLeagues: any[];
    todayTotalLeagues: number;
  }>({ completedLeagues: [], inProgressLeagues: [], todayTotalLeagues: 0 });
  const [loadingRoundsDash, setLoadingRoundsDash] = useState(false);

  // Dashboard Global de Escalações (Sem dropdown)
  const [lineupsDashboard, setLineupsDashboard] = useState<any[]>([]);
  const [loadingLineupsDash, setLoadingLineupsDash] = useState(false);

  // Fila de Notificações do Sentinel
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Histórico Local
  const [history, setHistory] = useState<any[]>([]);

  // Atualiza relógio a cada segundo para contagem regressiva em tempo real
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling automático a cada 15s
  useEffect(() => {
    fetchQueue();
    if (activeTab === 'round') fetchRoundsDashboard();
    if (activeTab === 'lineups') fetchLineupsDashboard();

    const interval = setInterval(() => {
      fetchQueue();
      if (activeTab === 'round') fetchRoundsDashboard();
      if (activeTab === 'lineups') fetchLineupsDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/queue`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setQueueItems(data.items);
      }
    } catch (e) {
      console.error("Erro ao buscar fila de push:", e);
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchRoundsDashboard = async () => {
    setLoadingRoundsDash(true);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/rounds-dashboard`);
      const data = await res.json();
      if (data.success) {
        setRoundsDashboard({
          completedLeagues: data.completedLeagues || [],
          inProgressLeagues: data.inProgressLeagues || [],
          todayTotalLeagues: data.todayTotalLeagues || 0
        });
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard de rodadas:", e);
    } finally {
      setLoadingRoundsDash(false);
    }
  };

  const fetchLineupsDashboard = async () => {
    setLoadingLineupsDash(true);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/lineups-dashboard`);
      const data = await res.json();
      if (data.success && Array.isArray(data.fixtures)) {
        setLineupsDashboard(data.fixtures);
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard de escalações:", e);
    } finally {
      setLoadingLineupsDash(false);
    }
  };

  const handleDispatchQueueItem = async (id: string, override?: { title?: string; body?: string }) => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/queue/${id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(override || {})
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          message: `Notificação aprovada e disparada via ${data.broadcastResult?.target || 'PocketBase'}!`
        });
        fetchQueue();
        fetchRoundsDashboard();
      } else {
        setSendResult({
          success: false,
          message: data.message || "Erro ao disparar item da fila."
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: "Erro de conexão ao despachar item da fila."
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelQueueItem = async (id: string) => {
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/queue/${id}/cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          message: "Notificação descartada com sucesso."
        });
        fetchQueue();
        fetchRoundsDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispatchLineup = async (fixtureId: number, titleOverride?: string, bodyOverride?: string) => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/lineups/${fixtureId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleOverride,
          body: bodyOverride
        })
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          message: `Alerta de escalação disparado com sucesso via ${data.broadcastResult?.target || 'PocketBase'}!`
        });
        fetchLineupsDashboard();
      } else {
        setSendResult({
          success: false,
          message: data.message || "Erro ao disparar alerta de escalação."
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: "Erro de conexão ao despachar alerta de escalação."
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDismissLineup = async (fixtureId: number) => {
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/lineups/${fixtureId}/dismiss`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          message: "Alerta de escalação descartado."
        });
        fetchLineupsDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendPush = async (customPayload?: { leagueId?: number; appSlug?: string; title: string; body: string; imageUrl?: string }) => {
    setIsSending(true);
    setSendResult(null);

    const targetLeagueId = customPayload?.leagueId || selectedComp.id;
    const targetSlug = customPayload?.appSlug || selectedComp.slug;

    const payload = {
      leagueId: targetLeagueId,
      appSlug: targetSlug,
      title: customPayload?.title || title,
      body: customPayload?.body || body,
      imageUrl: customPayload?.imageUrl || imageUrl,
      dataPayload: {
        app_slug: targetSlug,
        league_id: String(targetLeagueId),
        type: 'broadcast'
      }
    };

    try {
      const res = await fetch('https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (resData.success) {
        setSendResult({
          success: true,
          message: `Push disparado com sucesso via ${resData.target}! (${resData.details?.sentCount || 0} aparelhos alcançados)`
        });
        setHistory(prev => [
          {
            id: Date.now(),
            title: payload.title,
            body: payload.body,
            compName: selectedComp.name,
            target: resData.target,
            sentCount: resData.details?.sentCount || 0,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
        fetchQueue();
        fetchRoundsDashboard();
        fetchLineupsDashboard();
      } else {
        setSendResult({
          success: false,
          message: resData.error || "Falha no envio da notificação."
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: "Erro de conexão com o Gateway de Push."
      });
    } finally {
      setIsSending(false);
    }
  };

  const pendingQueueItems = queueItems.filter(item => item.status === 'PENDING_APPROVAL');

  // Formatação de contagem regressiva
  const formatTimeRemaining = (targetDateStr: string, prefixText = "Auto-Disparo em:") => {
    const diff = new Date(targetDateStr).getTime() - nowTime;
    if (diff <= 0) return "Disparando via worker...";
    const mins = Math.floor(diff / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${prefixText} ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} min`;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link 
              href="/adminpanel/agents" 
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Agente de Push Inteligente & Broadcast
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  PAINEL GLOBAL ON-TIME
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Supervisão agregada em tempo real com disparo de resumos, escalações e auto-fallback por inteligência de background.
              </p>
            </div>
          </div>
        </div>

        {/* Seletor exibido apenas no Broadcast Manual */}
        {activeTab === 'manual' && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 pl-2">Liga Alvo:</span>
            <select 
              value={selectedComp.id}
              onChange={(e) => {
                const comp = COMPETITIONS.find(c => c.id === Number(e.target.value));
                if (comp) setSelectedComp(comp);
              }}
              className="bg-slate-950 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {COMPETITIONS.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.cluster}] {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('round')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'round'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Resumos do Dia (Global)
          {roundsDashboard.completedLeagues.length > 0 && (
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {roundsDashboard.completedLeagues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lineups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'lineups'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          Escalações On-Time (&lt; 2h)
          {lineupsDashboard.filter(f => f.status === 'AVAILABLE').length > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {lineupsDashboard.filter(f => f.status === 'AVAILABLE').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'manual'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Flame className="h-4 w-4" />
          Simulador & Manual
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'history'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          Histórico & Fila ({queueItems.length})
        </button>
      </div>

      {/* Feedback de Envio */}
      {sendResult && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          sendResult.success 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {sendResult.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{sendResult.message}</span>
        </div>
      )}

      {/* 🚀 Banner em Destaque: Resumo de Rodada Pronto na Fila do Sentinel */}
      {pendingQueueItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              Resumo de Rodada Concluída Aguardando Operador ({pendingQueueItems.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Sentinel Watcher Ativo (Janela 60m)
            </span>
          </div>

          {pendingQueueItems.map((item) => (
            <div 
              key={item.id}
              className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-indigo-500/10 border border-amber-500/30 backdrop-blur-xl shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                    🏁 {item.round}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    Destino: <strong className="text-white">{item.target || item.appSlug}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/20 text-xs font-mono text-amber-300">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>{formatTimeRemaining(item.scheduledAutoDispatchAt)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-300 font-mono bg-slate-950/90 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                  {item.body}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => handleDispatchQueueItem(item.id)}
                  disabled={isSending}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  Aprovar e Disparar Agora
                </button>

                <button
                  onClick={() => {
                    setTitle(item.title);
                    setBody(item.body);
                    setImageUrl(item.imageUrl || "");
                    const matched = COMPETITIONS.find(c => c.id === item.leagueId || c.slug === item.appSlug);
                    if (matched) setSelectedComp(matched);
                    setActiveTab('manual');
                  }}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition"
                >
                  Editar no Simulador
                </button>

                <button
                  onClick={() => handleCancelQueueItem(item.id)}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 border border-rose-500/20 rounded-xl transition"
                >
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: RESUMOS DO DIA (PAINEL GLOBAL SEM DROPDOWN)                        */}
      {/* ========================================================================= */}
      {activeTab === 'round' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Painel Global de Rodadas do Dia (Todas as Ligas)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualização unificada das competições com jogos hoje. Resumo automático conciso e disparo com 1 clique.
              </p>
            </div>
            <button
              onClick={fetchRoundsDashboard}
              disabled={loadingRoundsDash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRoundsDash ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {loadingRoundsDash ? (
            <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
              Auditando todas as partidas do dia em todos os módulos...
            </div>
          ) : (
            <div className="space-y-8">
              {/* Seção 1: Rodadas 100% Concluídas Hoje */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Rodadas Concluídas Hoje — Prontas para Envio ({roundsDashboard.completedLeagues.length})
                </h3>

                {roundsDashboard.completedLeagues.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center text-xs text-slate-500">
                    Nenhuma rodada 100% finalizada até o momento. Conforme o último jogo do dia encerrar, a liga surgirá aqui automaticamente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roundsDashboard.completedLeagues.map((lg) => {
                      const isDispatched = lg.queueItem && lg.queueItem.status.startsWith('DISPATCHED');
                      return (
                        <div 
                          key={lg.leagueId}
                          className={`p-5 rounded-3xl border backdrop-blur-xl space-y-3.5 transition ${
                            isDispatched 
                              ? 'bg-slate-900/40 border-slate-800 opacity-80'
                              : 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{lg.module?.icon || '⚽'}</span>
                              <div>
                                <h4 className="text-sm font-bold text-white">{lg.leagueName}</h4>
                                <span className="text-[11px] text-slate-400 font-medium">{lg.round} ({lg.finishedMatches}/{lg.totalMatches} FT)</span>
                              </div>
                            </div>

                            {isDispatched ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ✅ ENVIADO
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                🟢 100% CONCLUÍDA
                              </span>
                            )}
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mensagem Padrão Concisa:</span>
                            <p className="text-xs font-bold text-white">{lg.suggestedTitle}</p>
                            <p className="text-xs text-slate-300 font-mono">{lg.suggestedBody}</p>
                          </div>

                          {lg.queueItem?.status === 'PENDING_APPROVAL' && (
                            <div className="flex items-center justify-between text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                              <span>Auto-Disparo Fallback:</span>
                              <strong className="animate-pulse">{formatTimeRemaining(lg.queueItem.scheduledAutoDispatchAt)}</strong>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            {isDispatched ? (
                              <div className="w-full py-2 bg-slate-950 rounded-xl text-center text-xs font-semibold text-slate-500 border border-slate-800">
                                Disparado às {new Date(lg.queueItem.dispatchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({lg.queueItem.sentCount || 0} entregues)
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSendPush({
                                    leagueId: lg.leagueId,
                                    appSlug: lg.appSlug,
                                    title: lg.suggestedTitle,
                                    body: lg.suggestedBody
                                  })}
                                  disabled={isSending}
                                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Disparar Agora
                                </button>

                                <button
                                  onClick={() => {
                                    setTitle(lg.suggestedTitle);
                                    setBody(lg.suggestedBody);
                                    const matched = COMPETITIONS.find(c => c.id === lg.leagueId || c.slug === lg.appSlug);
                                    if (matched) setSelectedComp(matched);
                                    setActiveTab('manual');
                                  }}
                                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seção 2: Rodadas em Andamento ou Agendadas Hoje */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Radio className="h-4 w-4 animate-pulse text-amber-400" />
                  Competições com Partidas em Andamento ou a Iniciar ({roundsDashboard.inProgressLeagues.length})
                </h3>

                {roundsDashboard.inProgressLeagues.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center text-xs text-slate-500">
                    Nenhuma outra partida agendada para hoje.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roundsDashboard.inProgressLeagues.map((lg) => (
                      <div key={lg.leagueId} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {lg.module?.icon} {lg.leagueName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            {lg.liveMatches > 0 ? `🔴 ${lg.liveMatches} AO VIVO` : `⏳ ${lg.scheduledMatches} A INICIAR`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{lg.round}</span>
                          <span>{lg.finishedMatches}/{lg.totalMatches} Encerrados</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: ESCALAÇÕES ON-TIME (PAINEL GLOBAL SEM DROPDOWN)                    */}
      {/* ========================================================================= */}
      {activeTab === 'lineups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                Painel Global de Escalações (Próximas 2 Horas)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor em tempo real de todas as partidas. Alerta automático aos 10 minutos pré-jogo com trava anti-duplicação.
              </p>
            </div>
            <button
              onClick={fetchLineupsDashboard}
              disabled={loadingLineupsDash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingLineupsDash ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {loadingLineupsDash ? (
            <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
              Varrendo escalações de todas as partidas nas próximas 2 horas...
            </div>
          ) : lineupsDashboard.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800/80">
              Nenhuma partida agendada para começar nas próximas 2 horas em nenhuma liga monitorada.
            </div>
          ) : (
            <div className="space-y-3">
              {lineupsDashboard.map((f) => {
                const isDispatched = f.status === 'DISPATCHED';
                const isAvailable = f.status === 'AVAILABLE';
                const isWaiting = f.status === 'WAITING';

                return (
                  <div 
                    key={f.id}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      isDispatched 
                        ? 'bg-slate-950/80 border-slate-800/80 opacity-75' 
                        : isAvailable
                          ? 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/40 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {/* Confronto e Informações */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs">{f.module?.icon}</span>
                        <span className="text-xs font-bold text-slate-400">{f.leagueName}</span>
                        <span className="text-xs font-mono text-slate-500">• Início às {new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>

                        {isDispatched ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✅ DISPARADO
                          </span>
                        ) : isAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                            🟢 22 TITULARES CONFIRMADOS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            🟡 AGUARDANDO DIVULGAÇÃO ({f.totalStarters}/22)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-0.5">
                        <span>{f.homeTeam.name}</span>
                        <span className="text-xs text-slate-500 font-normal">({f.homeTeam.startersCount}/11)</span>
                        <span className="text-xs text-slate-400 font-bold">x</span>
                        <span>{f.awayTeam.name}</span>
                        <span className="text-xs text-slate-500 font-normal">({f.awayTeam.startersCount}/11)</span>
                      </h4>

                      <p className="text-[11px] text-slate-400 font-mono">
                        Notificação: <span className="text-slate-200">"Escalação disponível. Confira os 11 titulares no app!"</span>
                      </p>
                    </div>

                    {/* Timer Regressivo e Ações */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {isAvailable && !isDispatched && (
                        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-xs font-mono text-indigo-300">
                          {formatTimeRemaining(f.autoDispatchAt, "⏰ Auto em:")}
                        </div>
                      )}

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isDispatched ? (
                          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400">
                            Enviado às {new Date(f.lineupDispatchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDispatchLineup(f.externalId, f.suggestedTitle, f.suggestedBody)}
                              disabled={isSending || isWaiting}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                isAvailable
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Disparar
                            </button>

                            <button
                              onClick={() => {
                                setTitle(f.suggestedTitle);
                                setBody(f.suggestedBody);
                                const matched = COMPETITIONS.find(c => c.id === f.leagueId || c.slug === f.appSlug);
                                if (matched) setSelectedComp(matched);
                                setActiveTab('manual');
                              }}
                              disabled={isWaiting}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-300 rounded-xl transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDismissLineup(f.externalId)}
                              className="px-2.5 py-2 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition"
                              title="Descartar notificação"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: BROADCAST MANUAL & SIMULADOR                                       */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulário de Configuração */}
          <div className="lg:col-span-7 space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Título da Notificação
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: ⚽ GOL DO FLAMENGO!"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Mensagem (Corpo do Push)
              </label>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Digite a chamada da notificação..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>URL da Imagem (Rich Push / Thumbnail Opcional)</span>
                <span className="text-[10px] text-slate-500 lowercase font-normal">estilo bigpicture no android</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem_noticia.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm pl-10 focus:outline-none focus:border-indigo-500 transition"
                />
                <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Instância Destino:</span>
                <span className="font-semibold text-white">{selectedComp.cluster}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>App Slug:</span>
                <span className="font-mono text-emerald-400">{selectedComp.slug}</span>
              </div>
            </div>

            <button
              onClick={() => handleSendPush()}
              disabled={isSending || !body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-indigo-600/30"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Disparando Notificação...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Disparar Push para {selectedComp.name}
                </>
              )}
            </button>
          </div>

          {/* Simulador Lock Screen */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-400" />
              Pré-Visualização no Smartphone
            </h3>
            <PushSimulator
              title={title}
              body={body}
              imageUrl={imageUrl}
              appName={selectedComp.name}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: HISTÓRICO & FILA DO SENTINEL                                       */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                Histórico & Auditoria de Disparos
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreamento de envios manuais, aprovações de operador e auto-disparos de fallback do Sentinel.
              </p>
            </div>
            <button
              onClick={fetchQueue}
              disabled={loadingQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
              Atualizar Fila
            </button>
          </div>

          {loadingQueue ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
              Carregando histórico e fila...
            </div>
          ) : queueItems.length === 0 && history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Nenhum disparo ou item na fila registrado.
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.map((item) => {
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'PENDING_APPROVAL':
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">AGUARDANDO OPERADOR (60m)</span>;
                    case 'DISPATCHED_OPERATOR':
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">APROVADO POR OPERADOR</span>;
                    case 'DISPATCHED_AUTO':
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">FALLBACK SENTINEL (AUTO)</span>;
                    case 'CANCELLED':
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-700">DESCARTADO</span>;
                    default:
                      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">{status}</span>;
                  }
                };

                return (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">[{item.appSlug}]</span>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.body}</p>
                    </div>

                    <div className="text-right sm:min-w-[130px]">
                      {item.status === 'PENDING_APPROVAL' ? (
                        <span className="text-xs font-mono text-amber-300 font-semibold">{formatTimeRemaining(item.scheduledAutoDispatchAt)}</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">{item.sentCount || 0} entregues</span>
                      )}
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {item.dispatchedAt ? new Date(item.dispatchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
