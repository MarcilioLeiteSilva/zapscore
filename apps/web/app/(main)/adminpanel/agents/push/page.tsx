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
  FileText
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
  { id: 610, name: "Campeonato Paulista", slug: "campeonato_paulista", country: "Brasil", cluster: "Estaduais" },
  { id: 624, name: "Campeonato Carioca", slug: "campeonato_carioca", country: "Brasil", cluster: "Estaduais" },
  { id: 629, name: "Campeonato Mineiro", slug: "campeonato_mineiro", country: "Brasil", cluster: "Estaduais" },
  { id: 614, name: "Campeonato Gaúcho", slug: "campeonato_gaucho", country: "Brasil", cluster: "Estaduais" },
  { id: 617, name: "Campeonato Baiano", slug: "campeonato_baiano", country: "Brasil", cluster: "Estaduais" },
  { id: 616, name: "Campeonato Paranaense", slug: "campeonato_paranaense", country: "Brasil", cluster: "Estaduais" },
  { id: 618, name: "Campeonato Cearense", slug: "campeonato_cearense", country: "Brasil", cluster: "Estaduais" },
  { id: 140, name: "La Liga (Espanha)", slug: "laliga", country: "Espanha", cluster: "Europa" },
  { id: 39, name: "Premier League (Inglaterra)", slug: "premierleague", country: "Inglaterra", cluster: "Europa" },
  { id: 78, name: "Bundesliga (Alemanha)", slug: "bundesliga", country: "Alemanha", cluster: "Europa" },
  { id: 135, name: "Serie A (Itália)", slug: "seriea-italia", country: "Itália", cluster: "Europa" },
  { id: 61, name: "Ligue 1 (França)", slug: "ligue1-franca", country: "França", cluster: "Europa" },
  { id: 2, name: "UEFA Champions League", slug: "champions_league", country: "Europa", cluster: "Europa" }
];

export default function PushAgentPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'round' | 'lineups' | 'history'>('manual');
  const [selectedComp, setSelectedComp] = useState<CompetitionOption>(COMPETITIONS[0]);
  
  // Formulário Manual
  const [title, setTitle] = useState("🔥 CLÁSSICO DECISIVO HOJE!");
  const [body, setBody] = useState("Bola rolando às 16h com transmissão ao vivo e minutagem lance a lance no app!");
  const [imageUrl, setImageUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Resumo de Rodada
  const [roundSummary, setRoundSummary] = useState<any>(null);
  const [loadingRound, setLoadingRound] = useState(false);

  // Alertas de Escalações
  const [lineupAlerts, setLineupAlerts] = useState<any[]>([]);
  const [loadingLineups, setLoadingLineups] = useState(false);

  // Histórico Local
  const [history, setHistory] = useState<any[]>([]);

  // Carrega resumo da rodada ao trocar de aba ou liga
  useEffect(() => {
    if (activeTab === 'round') {
      fetchRoundSummary(selectedComp.id);
    } else if (activeTab === 'lineups') {
      fetchLineupAlerts(selectedComp.id);
    }
  }, [activeTab, selectedComp]);

  const fetchRoundSummary = async (leagueId: number) => {
    setLoadingRound(true);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/round-summary?leagueId=${leagueId}`);
      const data = await res.json();
      setRoundSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRound(false);
    }
  };

  const fetchLineupAlerts = async (leagueId: number) => {
    setLoadingLineups(true);
    try {
      const res = await fetch(`https://zapscore-zapscore-api.gtalg3.easypanel.host/notifications/lineups-alert?leagueId=${leagueId}`);
      const data = await res.json();
      setLineupAlerts(data.fixtures || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLineups(false);
    }
  };

  const handleSendPush = async (customPayload?: { title: string; body: string; imageUrl?: string }) => {
    setIsSending(true);
    setSendResult(null);

    const payload = {
      leagueId: selectedComp.id,
      appSlug: selectedComp.slug,
      title: customPayload?.title || title,
      body: customPayload?.body || body,
      imageUrl: customPayload?.imageUrl || imageUrl,
      dataPayload: {
        app_slug: selectedComp.slug,
        league_id: String(selectedComp.id),
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
        // Adiciona ao histórico
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
                  MULTI-POCKETBASE
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Disparo semi-automático de notificações estratégicas com preview em tempo real e entrega via Firebase FCM v1.
              </p>
            </div>
          </div>
        </div>

        {/* Seletor Global de Competição */}
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
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'manual'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Flame className="h-4 w-4" />
          Broadcast Manual
        </button>

        <button
          onClick={() => setActiveTab('round')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'round'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Resumo de Placares
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
          Alertas de Escalações
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
          Histórico ({history.length})
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

      {/* Conteúdo das Abas */}
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

      {/* Aba: Resumo de Placares da Rodada */}
      {activeTab === 'round' && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Resumo Automático de Placares da Rodada
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compilador de resultados direto e conciso gerado quando 100% dos jogos da rodada atingem FT.
              </p>
            </div>
            <button
              onClick={() => fetchRoundSummary(selectedComp.id)}
              disabled={loadingRound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRound ? 'animate-spin' : ''}`} />
              Recarregar
            </button>
          </div>

          {loadingRound ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
              Carregando status dos confrontos...
            </div>
          ) : roundSummary?.success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{roundSummary.round}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {roundSummary.finishedMatches} de {roundSummary.totalMatches} partidas finalizadas (FT)
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  roundSummary.isCompleted 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {roundSummary.isCompleted ? 'RODADA CONCLUÍDA' : 'EM ANDAMENTO'}
                </span>
              </div>

              {/* Sugestão de Push */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Sugestão de Notificação:</span>
                <p className="text-sm font-bold text-white">{roundSummary.suggestedTitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {roundSummary.suggestedBody}
                </p>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setTitle(roundSummary.suggestedTitle);
                      setBody(roundSummary.suggestedBody);
                      setActiveTab('manual');
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition"
                  >
                    Editar no Simulador
                  </button>
                  <button
                    onClick={() => handleSendPush({
                      title: roundSummary.suggestedTitle,
                      body: roundSummary.suggestedBody
                    })}
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Aprovar e Disparar Agora
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Nenhuma partida encontrada para a liga selecionada.
            </div>
          )}
        </div>
      )}

      {/* Aba: Alertas de Escalações */}
      {activeTab === 'lineups' && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                Monitor de Escalações Oficiais (Jogos em &lt; 60 min)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alerta semi-automático para avisar a torcida quando os 22 titulares forem disponibilizados.
              </p>
            </div>
            <button
              onClick={() => fetchLineupAlerts(selectedComp.id)}
              disabled={loadingLineups}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingLineups ? 'animate-spin' : ''}`} />
              Recarregar
            </button>
          </div>

          {loadingLineups ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-400" />
              Buscando partidas prestes a iniciar...
            </div>
          ) : lineupAlerts.length > 0 ? (
            <div className="space-y-4">
              {lineupAlerts.map((f, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{f.homeTeam} x {f.awayTeam}</h4>
                    <p className="text-xs text-slate-400 mt-1">Horário: {new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button
                    onClick={() => handleSendPush({
                      title: f.suggestedTitle,
                      body: f.suggestedBody
                    })}
                    disabled={isSending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition flex items-center gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Disparar Escalação
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Nenhuma partida iniciando nos próximos 60 minutos para esta liga.
            </div>
          )}
        </div>
      )}

      {/* Aba: Histórico */}
      {activeTab === 'history' && (
        <div className="space-y-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-2">Histórico de Disparos Recentes</h2>
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Nenhum disparo manual realizado nesta sessão.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">[{item.compName}]</span>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.body}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">{item.sentCount} entregues</span>
                    <p className="text-[10px] text-slate-500">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
