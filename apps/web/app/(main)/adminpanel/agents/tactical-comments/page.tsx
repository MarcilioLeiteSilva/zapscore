"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Bot,
  Layers,
  Send,
  Loader2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";
const PB_COMMENTS_URL = "https://zapscore-pocketbase-comentarios.gtalg3.easypanel.host";
const CRAWL4AI_URL = "https://zapscore-crwal4ai.gtalg3.easypanel.host";

interface CommentItem {
  id: string;
  fixture_id: number;
  league_id: number;
  minute: number;
  phase: string;
  title: string;
  comment: string;
  sentiment: string;
  created: string;
}

export default function TacticalCommentsAgentPage() {
  // Status de Infraestrutura
  const [pbStatus, setPbStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [crawlStatus, setCrawlStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [crawlStats, setCrawlStats] = useState<{ memory?: number; cpu?: number } | null>(null);

  // Feed de Comentários Recentes
  const [recentComments, setRecentComments] = useState<CommentItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Form de Teste / Disparo Manual
  const [targetFixtureId, setTargetFixtureId] = useState<string>('');
  const [targetPhase, setTargetPhase] = useState<string>('FIRST_HALF');
  const [targetMinute, setTargetMinute] = useState<string>('35');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [adminApiKey, setAdminApiKey] = useState<string>('7Ma+1d8R2VkkAEUzGNLhrVYaoYfOLaUdxXTkocQa+ac=');
  const [generating, setGenerating] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string; data?: any } | null>(null);

  // Verifica a saúde dos serviços
  const checkHealthServices = async () => {
    try {
      // 1. PocketBase Health
      const pbRes = await fetch(`${PB_COMMENTS_URL}/api/health`, { cache: 'no-store' });
      setPbStatus(pbRes.ok ? 'healthy' : 'offline');
    } catch {
      setPbStatus('offline');
    }

    try {
      // 2. Crawl4AI Health
      const crawlRes = await fetch(`${CRAWL4AI_URL}/health`, { cache: 'no-store' });
      if (crawlRes.ok) {
        const data = await crawlRes.json();
        setCrawlStatus('healthy');
        setCrawlStats({ memory: data.memory_usage, cpu: data.cpu_usage });
      } else {
        setCrawlStatus('offline');
      }
    } catch {
      setCrawlStatus('offline');
    }
  };

  // Carrega feed de comentários recentes direto do PocketBase
  const loadRecentComments = async () => {
    setLoadingFeed(true);
    try {
      const res = await fetch(
        `${PB_COMMENTS_URL}/api/collections/fixture_comments/records?sort=-created&perPage=15`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setRecentComments(data.items || []);
      }
    } catch (e) {
      console.error("Falha ao carregar comentários do PocketBase", e);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    checkHealthServices();
    loadRecentComments();
  }, []);

  // Executa o disparo manual via API ZapScore
  const handleGenerateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFixtureId.trim()) {
      setActionResult({ type: 'error', message: 'Informe o ID da partida (fixture_id).' });
      return;
    }

    setGenerating(true);
    setActionResult(null);

    try {
      const payload: any = {
        phase: targetPhase,
      };
      if (targetMinute) payload.minute = parseInt(targetMinute, 10);
      if (externalUrl.trim()) payload.externalContextUrl = externalUrl.trim();

      const res = await fetch(`${API_URL}/fixtures/${targetFixtureId.trim()}/comments/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': adminApiKey.trim(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setActionResult({
          type: 'success',
          message: 'Comentário tático gerado com sucesso e persistido no PocketBase!',
          data: data.data,
        });
        // Atualiza a lista recente
        setTimeout(loadRecentComments, 800);
      } else {
        setActionResult({
          type: 'error',
          message: data.message || `Erro ${res.status}: Não foi possível gerar o comentário.`,
        });
      }
    } catch (err: any) {
      setActionResult({
        type: 'error',
        message: `Falha na requisição: ${err.message}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header & Breadcrumbs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <Link href="/adminpanel" className="hover:text-white transition-colors">AdminPanel</Link>
          <span>/</span>
          <Link href="/adminpanel/agents" className="hover:text-white transition-colors">Central de Agentes</Link>
          <span>/</span>
          <span className="text-violet-400 font-medium">Comentários Táticos ao Vivo</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <MessageSquare size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Agente de Comentários Táticos ao Vivo
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-semibold tracking-wide">
                  BRASILEIRÃO A & B
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Timeline cronológica (Pré-Jogo, Tempo Real e Resumo Final) via Gemini 1.5 Flash + Crawl4AI + PocketBase dedicado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                checkHealthServices();
                loadRecentComments();
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw size={14} className={loadingFeed ? 'animate-spin text-violet-400' : ''} />
              Atualizar Status
            </button>
            <Link
              href="/adminpanel/agents"
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={14} />
              Voltar aos Agentes
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Grid de Infraestrutura & Saúde */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card PocketBase */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database size={14} className="text-violet-400" />
                PocketBase Comentários
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                pbStatus === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : pbStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  pbStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`} />
                {pbStatus === 'healthy' ? 'Conectado' : pbStatus === 'checking' ? 'Testando...' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-slate-400 break-all mb-2 font-mono">
              zapscore-pocketbase-comentarios...
            </p>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span>Collection: <strong className="text-slate-300">fixture_comments</strong></span>
              <span>Risco Postgres: <strong className="text-emerald-400">Zero (Isolado)</strong></span>
            </div>
          </div>

          {/* Card Crawl4AI */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu size={14} className="text-cyan-400" />
                Microserviço Crawl4AI
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                crawlStatus === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : crawlStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  crawlStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`} />
                {crawlStatus === 'healthy' ? 'Online' : crawlStatus === 'checking' ? 'Testando...' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2 font-mono">
              Porta 11235 • basic-amd64 • Token 256b
            </p>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span>RAM Host: <strong className="text-slate-300">{crawlStats?.memory ? `${crawlStats.memory}%` : '~65%'}</strong></span>
              <span>Limite: <strong className="text-slate-300">1024 MB (Blindado)</strong></span>
            </div>
          </div>

          {/* Card Motor de IA */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bot size={14} className="text-orange-400" />
                Motor IA & Ligas
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Gemini 1.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Ligas: <strong className="text-white">Brasileirão Série A (71) e Série B (72)</strong>
            </p>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span>Fallback: <strong className="text-slate-300">Stats Nativo</strong></span>
              <span>Push Notifications: <strong className="text-slate-300">Zero (Aba App)</strong></span>
            </div>
          </div>
        </div>

        {/* Bloco Principal: Simulador / Disparo e Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Disparador Manual */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" />
                Gerador de Comentário Tático
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Simule ou gere sob demanda um insight tático para uma partida no Brasileirão.
              </p>

              <form onSubmit={handleGenerateComment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    ID da Partida (fixtureExternalId) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={targetFixtureId}
                    onChange={(e) => setTargetFixtureId(e.target.value)}
                    placeholder="Ex: 1208620 (ou qualquer ID da fixture)"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Fase do Jogo
                    </label>
                    <select
                      value={targetPhase}
                      onChange={(e) => setTargetPhase(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all"
                    >
                      <option value="PRE_MATCH">Pré-Jogo</option>
                      <option value="FIRST_HALF">1º Tempo</option>
                      <option value="HALF_TIME">Intervalo</option>
                      <option value="SECOND_HALF">2º Tempo</option>
                      <option value="FULL_TIME">Fim de Jogo (Resumo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">
                      Minuto do Jogo
                    </label>
                    <input
                      type="number"
                      value={targetMinute}
                      onChange={(e) => setTargetMinute(e.target.value)}
                      placeholder="Ex: 35"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    URL Externa para Crawl4AI (Opcional)
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://ge.globo.com/futebol/... (opcional)"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processando IA & Salvando no PocketBase...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Gerar e Persistir no PocketBase
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Feedback de Ação */}
              {actionResult && (
                <div className={`mt-4 p-3.5 rounded-xl border text-xs ${
                  actionResult.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {actionResult.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {actionResult.message}
                  </div>
                  {actionResult.data && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-1">
                      <div><strong>Título:</strong> {actionResult.data.title}</div>
                      <div><strong>Sentimento:</strong> {actionResult.data.sentiment}</div>
                      <div><strong>ID PB:</strong> <span className="font-mono">{actionResult.data.id}</span></div>
                      <div className="text-[11px] text-emerald-200/80 italic mt-1">&ldquo;{actionResult.data.comment}&rdquo;</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Feed de Comentários no PocketBase */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Layers size={18} className="text-violet-400" />
                    Feed de Comentários no PocketBase
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registros da collection <strong className="text-slate-200 font-mono">fixture_comments</strong>.
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {recentComments.length} registro(s)
                </span>
              </div>

              {loadingFeed ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 size={24} className="animate-spin text-violet-400" />
                  <span className="text-xs">Consultando PocketBase Comentários...</span>
                </div>
              ) : recentComments.length === 0 ? (
                <div className="py-12 px-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 space-y-2">
                  <MessageSquare size={32} className="mx-auto text-slate-600 stroke-[1.5]" />
                  <p className="text-xs text-slate-400">Nenhum comentário tático registrado ainda.</p>
                  <p className="text-[11px] text-slate-600">Use o simulador ao lado para gerar o primeiro insight tático.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {recentComments.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono">
                            {item.phase} • {item.minute}&apos;
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {item.title}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          item.sentiment === 'DOMINANT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.sentiment === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : item.sentiment === 'SURPRISE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.sentiment}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.comment}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                        <span>Fixture ID: <strong className="text-slate-400">{item.fixture_id}</strong> (Liga {item.league_id})</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(item.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
