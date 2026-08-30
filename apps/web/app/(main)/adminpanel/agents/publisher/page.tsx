"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Newspaper, 
  ArrowLeft, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Send,
  RefreshCw,
  Clock,
  Eye
} from 'lucide-react';

interface League {
  id: string;
  name: string;
  externalId?: number;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  source?: string | null;
  externalUrl?: string | null;
  createdAt: string;
  league?: { name: string } | null;
  team?: { name: string } | null;
}

export default function NewsPublisherAgentPage() {
  const [url, setUrl] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [overrideTitle, setOverrideTitle] = useState('');
  const [overrideDescription, setOverrideDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sendPushWithNews, setSendPushWithNews] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<NewsItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Lista padrão de fallback caso a API demore a responder
  const defaultLeagues: League[] = [
    { id: 'carioca-a1', name: 'Campeonato Carioca (Série A)' },
    { id: 'carioca-a2', name: 'Carioca Série A2' },
    { id: 'paulista-a1', name: 'Campeonato Paulista' },
    { id: 'paulista-a2', name: 'Paulista Série A2' },
    { id: 'mineiro', name: 'Campeonato Mineiro' },
    { id: 'gaucho', name: 'Campeonato Gaúcho' },
    { id: 'brasileirao-a', name: 'Brasileirão Série A' },
    { id: 'brasileirao-b', name: 'Brasileirão Série B' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

  const fetchLeagues = async () => {
    try {
      const res = await fetch(`${API_URL}/leagues`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLeagues(data);
          return;
        }
      }
    } catch (e) {
      console.warn('Usando lista padrão de ligas');
    }
    setLeagues(defaultLeagues);
  };

  const fetchRecentNews = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/news?limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecentNews(data);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar histórico de notícias:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
    fetchRecentNews();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Por favor, informe a URL da notícia.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessResult(null);

    try {
      const res = await fetch(`${API_URL}/news/publish-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          leagueId: selectedLeagueId || undefined,
          overrideTitle: overrideTitle.trim() || undefined,
          overrideDescription: overrideDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Falha ao extrair e publicar a notícia.');
      }

      setSuccessResult(data);

      // Dispara push opcional se habilitado
      if (sendPushWithNews && data && data.title) {
        try {
          await fetch(`${API_URL}/notifications/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leagueId: selectedLeagueId ? Number(selectedLeagueId) : undefined,
              title: `📰 ${data.title}`,
              body: data.description || 'Confira os detalhes completos desta notícia no aplicativo.',
              imageUrl: data.imageUrl || undefined,
              dataPayload: {
                type: 'news',
                id: String(data.id || ''),
                league_id: String(selectedLeagueId || '')
              }
            })
          });
        } catch (pushErr) {
          console.warn('Erro ao disparar push da notícia:', pushErr);
        }
      }

      setUrl('');
      setOverrideTitle('');
      setOverrideDescription('');
      fetchRecentNews();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao conectar com o serviço do agente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <Link href="/adminpanel/agents" className="hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Hub de Agentes
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-medium">Publicador de Notícias</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-emerald-400" />
            Agente Publicador de Notícias
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Cole a URL de qualquer notícia de clube ou portal e o agente extrai foto, manchete, lead e publica na competição selecionada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            MOTOR CRAWLER ATIVO
          </span>
        </div>
      </div>

      {/* Grid: Formulário + Preview / Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Formulário de Entrada */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Publicação Semi-Automática por Link
            </h2>

            <form onSubmit={handlePublish} className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  URL da Notícia (Portal ou Site do Clube) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://globoesporte.globo.com/... ou https://acessocarioca.com.br/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Competição / Liga de Destino */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Competição / Destino no App <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedLeagueId}
                    onChange={(e) => setSelectedLeagueId(e.target.value)}
                    className="w-full bg-[#172030] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Detectar Automaticamente pelo Conteúdo</option>
                    {leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  💡 Selecione <strong>Carioca Série A2</strong> ou <strong>Campeonato Carioca</strong> para forçar a matéria na aba correta mesmo se não citar o campeonato.
                </p>
              </div>

              {/* Toggle de Ajustes Opcionais */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                >
                  {showAdvanced ? '- Ocultar Edição Manual' : '+ Personalizar Manchete / Lead (Opcional)'}
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Manchete Personalizada (Substituir a original)
                    </label>
                    <input
                      type="text"
                      value={overrideTitle}
                      onChange={(e) => setOverrideTitle(e.target.value)}
                      placeholder="Deixe em branco para extrair automaticamente do site"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Resumo / Lead Personalizado
                    </label>
                    <textarea
                      value={overrideDescription}
                      onChange={(e) => setOverrideDescription(e.target.value)}
                      rows={2}
                      placeholder="Deixe em branco para extrair automaticamente"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Toggle de Disparo de Notificação Push */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="sendPushToggle"
                    checked={sendPushWithNews}
                    onChange={(e) => setSendPushWithNews(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="sendPushToggle" className="text-xs font-semibold text-white cursor-pointer select-none">
                    🔔 Disparar Notificação Push ao Publicar (com Rich Push / Foto)
                  </label>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">FCM v1</span>
              </div>

              {/* Mensagens de Feedback */}
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Botão de Ação */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Raspando Imagem e Publicando Notícia...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Capturar Foto & Publicar Notícia
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card de Informações e Dicas */}
          <div className="bg-[#121824]/60 border border-white/5 rounded-xl p-4 text-xs text-white/60 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Como a Captura de Fotos Funciona:
            </div>
            <p>
              O robô utiliza os mesmos seletores de OpenGraph (<code>og:image</code>), Twitter Cards e resolução de CDN do Crawler oficial, garantindo imagens nítidas sem marcas d’água e com proxy de bypass quando necessário.
            </p>
          </div>
        </div>

        {/* Coluna Direita: Preview do Resultado e Histórico Recente */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preview da Notícia Recém-Publicada */}
          {successResult && (
            <div className="bg-[#121824] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5" />
                Notícia Publicada com Sucesso no App!
              </div>

              <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 mb-3">
                {successResult.imageUrl ? (
                  <img
                    src={successResult.imageUrl}
                    alt={successResult.title}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-white/5 text-white/30 text-xs">
                    Sem imagem capturada
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {successResult.source && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80">
                      {successResult.source}
                    </span>
                  )}
                  {successResult.league && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {successResult.league.name}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-bold text-sm line-clamp-2">
                  {successResult.title}
                </h3>
                <p className="text-white/60 text-xs line-clamp-3">
                  {successResult.description}
                </p>
                {successResult.externalUrl && (
                  <a
                    href={successResult.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline pt-1"
                  >
                    Abrir link original <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Histórico Recente de Publicações */}
          <div className="bg-[#121824] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Últimas Notícias no Sistema
              </h3>
              <button
                onClick={fetchRecentNews}
                className="text-white/40 hover:text-white transition-colors p-1"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 flex justify-center text-white/40">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : recentNews.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">
                Nenhuma notícia encontrada no momento.
              </p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                {recentNews.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-all flex gap-3"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white/5"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white/20">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-1">
                        <span className="text-emerald-400 font-semibold truncate">
                          {item.league?.name || item.source || 'Geral'}
                        </span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h4 className="text-xs font-medium text-white/90 line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
