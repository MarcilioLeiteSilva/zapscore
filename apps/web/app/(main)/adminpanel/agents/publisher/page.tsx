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
  Eye,
  Bell,
  Smartphone,
  X,
  Flame,
  Check,
  ChevronDown
} from 'lucide-react';
import { PushSimulator } from '../push/components/PushSimulator';

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
  league?: { name: string; externalId?: number } | null;
  team?: { name: string } | null;
}

export default function NewsPublisherAgentPage() {
  const [url, setUrl] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [overrideTitle, setOverrideTitle] = useState('');
  const [overrideDescription, setOverrideDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Rich Push States para Publicação Direta
  const [sendPushWithNews, setSendPushWithNews] = useState(false);
  const [customPushTitle, setCustomPushTitle] = useState('');
  const [customPushBody, setCustomPushBody] = useState('');
  const [showPushCustomizer, setShowPushCustomizer] = useState(false);
  const [showLiveSimulator, setShowLiveSimulator] = useState(false);

  // Modal de Disparo de Rich Push para Notícia do Histórico
  const [pushModalItem, setPushModalItem] = useState<NewsItem | null>(null);
  const [modalPushTitle, setModalPushTitle] = useState('');
  const [modalPushBody, setModalPushBody] = useState('');
  const [modalPushLeagueId, setModalPushLeagueId] = useState('');
  const [isSendingModalPush, setIsSendingModalPush] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<NewsItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [leagues, setLeagues] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Sanfona de competições (null = todas fechadas por padrão; abrir uma fecha a outra)
  const [openAccordionKey, setOpenAccordionKey] = useState<string | null>(null);

  const toggleAccordion = (key: string) => {
    setOpenAccordionKey((prev) => (prev === key ? null : key));
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const getLeagueDisplayName = (l: any) => {
    if (!l) return "Sem liga";
    const extId = l.externalId || (l.id && !isNaN(Number(l.id)) ? Number(l.id) : 0);
    if (extId === 71 || (l.name === 'Serie A' && l.country === 'Brazil')) return 'Brasileirão Série A (Brasil)';
    if (extId === 72 || (l.name === 'Serie B' && l.country === 'Brazil')) return 'Brasileirão Série B (Brasil)';
    if (extId === 135 || (l.name === 'Serie A' && l.country === 'Italy')) return 'Serie A (Itália)';
    if (extId === 39) return 'Premier League (Inglaterra)';
    if (extId === 140) return 'La Liga (Espanha)';
    if (extId === 78) return 'Bundesliga (Alemanha)';
    if (extId === 61) return 'Ligue 1 (França)';
    if (extId === 2) return 'Champions League (Europa)';
    return `${l.name}${l.country ? ` (${l.country})` : ''}`;
  };

  const resolveLeagueInfo = (leagueOrId: any): { leagueIdForPrisma?: string; externalId?: number; appSlug?: string; appName: string } => {
    if (!leagueOrId) return { appName: "ZapScore" };

    let l: any = null;
    if (typeof leagueOrId === 'object') {
      l = leagueOrId;
    } else {
      l = leagues.find(
        (x) =>
          String(x.id) === String(leagueOrId) ||
          String(x.externalId) === String(leagueOrId)
      );
    }

    const prismaId = l?.id || (typeof leagueOrId === 'string' && leagueOrId.includes('-') ? leagueOrId : undefined);
    const extId = l?.externalId || (!isNaN(Number(leagueOrId)) ? Number(leagueOrId) : undefined);
    const name = (l?.name || '').trim();
    const country = (l?.country || '').trim();
    const nameLower = name.toLowerCase();

    // 1. Brasil (Brasileirão Séries A e B, Copa do Brasil)
    if (
      extId === 71 ||
      extId === 72 ||
      extId === 73 ||
      (name === 'Serie A' && country === 'Brazil') ||
      (name === 'Serie B' && country === 'Brazil') ||
      nameLower.includes('brasileir')
    ) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 71,
        appSlug: 'brasileirao',
        appName: 'Brasileirão',
      };
    }

    // 2. Europa: Serie A Itália
    if (
      extId === 135 ||
      (name === 'Serie A' && country === 'Italy') ||
      (nameLower.includes('serie a') && country.toLowerCase().includes('ital'))
    ) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: 135,
        appSlug: 'seriea-italia',
        appName: 'Serie A (Itália)',
      };
    }

    // Premier League
    if (extId === 39 || nameLower.includes('premier')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: 39,
        appSlug: 'premierleague',
        appName: 'Premier League',
      };
    }

    // La Liga
    if (extId === 140 || nameLower.includes('la liga')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: 140,
        appSlug: 'laliga',
        appName: 'La Liga',
      };
    }

    // Bundesliga
    if (extId === 78 || nameLower.includes('bundesliga')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: 78,
        appSlug: 'bundesliga',
        appName: 'Bundesliga',
      };
    }

    // Ligue 1
    if (extId === 61 || nameLower.includes('ligue 1')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: 61,
        appSlug: 'ligue1-franca',
        appName: 'Ligue 1',
      };
    }

    // Champions League
    if (extId === 2 || nameLower.includes('champions')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: 2,
        appSlug: 'champions_league',
        appName: 'Champions League',
      };
    }

    // 3. Estaduais
    if (extId === 475 || extId === 476 || extId === 610 || nameLower.includes('paulista')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 475,
        appSlug: 'campeonato_paulista',
        appName: 'Campeonato Paulista',
      };
    }

    if (extId === 624 || extId === 625 || extId === 851 || nameLower.includes('carioca')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 624,
        appSlug: 'campeonato_carioca',
        appName: 'Campeonato Carioca',
      };
    }

    if (extId === 629 || extId === 619 || nameLower.includes('mineiro')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 629,
        appSlug: 'campeonato_mineiro',
        appName: 'Campeonato Mineiro',
      };
    }

    if (extId === 477 || extId === 478 || extId === 614 || nameLower.includes('gaucho') || nameLower.includes('gaúcho')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 477,
        appSlug: 'campeonato_gaucho',
        appName: 'Campeonato Gaúcho',
      };
    }

    if (extId === 602 || extId === 613 || extId === 617 || nameLower.includes('baiano')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 602,
        appSlug: 'campeonato_baiano',
        appName: 'Campeonato Baiano',
      };
    }

    if (extId === 606 || extId === 616 || nameLower.includes('paranaense')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 606,
        appSlug: 'campeonato_paranaense',
        appName: 'Campeonato Paranaense',
      };
    }

    if (extId === 609 || extId === 620 || extId === 618 || nameLower.includes('cearense')) {
      return {
        leagueIdForPrisma: prismaId,
        externalId: extId || 609,
        appSlug: 'campeonato_cearense',
        appName: 'Campeonato Cearense',
      };
    }

    return {
      leagueIdForPrisma: prismaId,
      externalId: extId,
      appName: name || "ZapScore",
    };
  };

  const getAppNameForLeague = (leagueId?: string | number) => {
    if (!leagueId) return "ZapScore";
    return resolveLeagueInfo(leagueId).appName;
  };

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
      const res = await fetch(`${API_URL}/news?limit=250`);
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

  // Agrupamento das notícias por competição para as abas sanfona
  const competitionGroups = React.useMemo(() => {
    const baseGroups: { key: string; name: string; icon: string; match: (item: NewsItem, info: any) => boolean }[] = [
      {
        key: 'brasileirao-a',
        name: 'Brasileirão Série A',
        icon: '🇧🇷',
        match: (item, info) => info.externalId === 71 || (item.league?.name === 'Serie A' && (item.league as any)?.country === 'Brazil'),
      },
      {
        key: 'brasileirao-b',
        name: 'Brasileirão Série B',
        icon: '🇧🇷',
        match: (item, info) => info.externalId === 72 || item.league?.name === 'Serie B',
      },
      {
        key: 'copa-brasil',
        name: 'Copa do Brasil',
        icon: '🏆',
        match: (item, info) => info.externalId === 73 || (item.league?.name || '').toLowerCase().includes('copa do brasil'),
      },
      {
        key: 'seriea-italia',
        name: 'Serie A (Itália)',
        icon: '🇮🇹',
        match: (item, info) => info.externalId === 135 || info.appSlug === 'seriea-italia' || (item.league?.name === 'Serie A' && (item.league as any)?.country === 'Italy'),
      },
      {
        key: 'premierleague',
        name: 'Premier League',
        icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        match: (item, info) => info.externalId === 39 || info.appSlug === 'premierleague',
      },
      {
        key: 'laliga',
        name: 'La Liga',
        icon: '🇪🇸',
        match: (item, info) => info.externalId === 140 || info.appSlug === 'laliga',
      },
      {
        key: 'champions-league',
        name: 'Champions League',
        icon: '⭐️',
        match: (item, info) => info.externalId === 2 || info.appSlug === 'champions_league',
      },
      {
        key: 'bundesliga',
        name: 'Bundesliga',
        icon: '🇩🇪',
        match: (item, info) => info.externalId === 78 || info.appSlug === 'bundesliga',
      },
      {
        key: 'ligue1',
        name: 'Ligue 1',
        icon: '🇫🇷',
        match: (item, info) => info.externalId === 61 || info.appSlug === 'ligue1-franca',
      },
      {
        key: 'paulista',
        name: 'Campeonato Paulista',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_paulista' || (item.league?.name || '').toLowerCase().includes('paulista'),
      },
      {
        key: 'carioca',
        name: 'Campeonato Carioca',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_carioca' || (item.league?.name || '').toLowerCase().includes('carioca'),
      },
      {
        key: 'mineiro',
        name: 'Campeonato Mineiro',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_mineiro' || (item.league?.name || '').toLowerCase().includes('mineiro'),
      },
      {
        key: 'gaucho',
        name: 'Campeonato Gaúcho',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_gaucho' || (item.league?.name || '').toLowerCase().includes('gaucho') || (item.league?.name || '').toLowerCase().includes('gaúcho'),
      },
      {
        key: 'baiano',
        name: 'Campeonato Baiano',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_baiano' || (item.league?.name || '').toLowerCase().includes('baiano'),
      },
      {
        key: 'paranaense',
        name: 'Campeonato Paranaense',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_paranaense' || (item.league?.name || '').toLowerCase().includes('paranaense'),
      },
      {
        key: 'cearense',
        name: 'Campeonato Cearense',
        icon: '📍',
        match: (item, info) => info.appSlug === 'campeonato_cearense' || (item.league?.name || '').toLowerCase().includes('cearense'),
      },
    ];

    const mappedGroups: { [key: string]: { key: string; name: string; icon: string; news: NewsItem[] } } = {};

    baseGroups.forEach((bg) => {
      mappedGroups[bg.key] = {
        key: bg.key,
        name: bg.name,
        icon: bg.icon,
        news: [],
      };
    });

    const otherGroups: { [key: string]: { key: string; name: string; icon: string; news: NewsItem[] } } = {};
    const generalNews: NewsItem[] = [];

    // Distribui cada notícia para a respectiva competição
    for (const item of recentNews) {
      const info = resolveLeagueInfo(item.league || (item as any).leagueId);
      let matched = false;

      for (const bg of baseGroups) {
        if (bg.match(item, info)) {
          mappedGroups[bg.key].news.push(item);
          matched = true;
          break;
        }
      }

      if (!matched) {
        if (item.league?.name) {
          const customKey = `custom-${item.league.name.toLowerCase().replace(/\s+/g, '-')}`;
          if (!otherGroups[customKey]) {
            otherGroups[customKey] = {
              key: customKey,
              name: item.league.name,
              icon: '⚽',
              news: [],
            };
          }
          otherGroups[customKey].news.push(item);
        } else {
          generalNews.push(item);
        }
      }
    }

    const result = Object.values(mappedGroups);

    // Adiciona outras competições que possuam notícias
    Object.values(otherGroups).forEach((og) => {
      if (og.news.length > 0) result.push(og);
    });

    // Adiciona grupo geral/sem liga no final
    result.push({
      key: 'geral',
      name: 'Outras Notícias / Geral',
      icon: '🌐',
      news: generalNews,
    });

    return result;
  }, [recentNews, leagues]);

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

      // Dispara Rich Push com BigPicture se habilitado
      if (sendPushWithNews && data && data.title) {
        try {
          const pushTitleToSend = customPushTitle.trim() || `📰 ${data.title}`;
          const pushBodyToSend = customPushBody.trim() || data.description || 'Confira os detalhes completos desta notícia no aplicativo.';

          const selectedLeagueObj = leagues.find(l => l.id === selectedLeagueId || String(l.externalId) === selectedLeagueId) || (data as any).league;
          const targetInfo = resolveLeagueInfo(selectedLeagueObj || selectedLeagueId);

          const pushRes = await fetch(`${API_URL}/notifications/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leagueId: targetInfo.externalId,
              appSlug: targetInfo.appSlug,
              title: pushTitleToSend,
              body: pushBodyToSend,
              imageUrl: data.imageUrl || undefined,
              dataPayload: {
                type: 'news',
                id: String(data.id || ''),
                league_id: String(targetInfo.externalId || ''),
                app_slug: targetInfo.appSlug || ''
              }
            })
          });

          if (pushRes.ok) {
            showToast('success', `Notícia publicada e Rich Push disparado com sucesso para ${targetInfo.appName}!`);
          } else {
            showToast('error', 'Notícia publicada, mas ocorreu uma falha ao disparar o push.');
          }
        } catch (pushErr: any) {
          console.warn('Erro ao disparar push da notícia:', pushErr);
          showToast('error', `Notícia salva, mas falhou o push: ${pushErr.message}`);
        }
      } else {
        showToast('success', 'Notícia extraída e publicada com sucesso!');
      }

      setUrl('');
      setOverrideTitle('');
      setOverrideDescription('');
      setCustomPushTitle('');
      setCustomPushBody('');
      fetchRecentNews();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao conectar com o serviço do agente.');
    } finally {
      setLoading(false);
    }
  };

  // Abre modal para disparo de Rich Push a partir de notícia existente no histórico
  const openPushModal = (item: NewsItem) => {
    setPushModalItem(item);
    setModalPushTitle(`📰 ${item.title}`);
    setModalPushBody(item.description || 'Toque para conferir a matéria completa no aplicativo!');
    
    // Procura a liga correspondente no array leagues
    const itemLeague: any = item.league;
    const itemLeagueId = (item as any).leagueId;

    const matchedLeague = leagues.find((l) => 
      (itemLeague?.id && l.id === itemLeague.id) ||
      (itemLeagueId && l.id === itemLeagueId) ||
      (itemLeague?.externalId && l.externalId === itemLeague.externalId) ||
      (itemLeague?.name && l.name === itemLeague.name && (!itemLeague?.country || l.country === itemLeague.country))
    );

    const targetKey = matchedLeague?.id || itemLeague?.id || itemLeagueId || (itemLeague?.externalId ? String(itemLeague.externalId) : '');
    setModalPushLeagueId(targetKey);
  };

  const handleSendModalPush = async () => {
    if (!pushModalItem) return;
    setIsSendingModalPush(true);

    try {
      const selectedLeagueObj = leagues.find(l => l.id === modalPushLeagueId || String(l.externalId) === modalPushLeagueId) || (pushModalItem as any).league;
      const targetInfo = resolveLeagueInfo(selectedLeagueObj || modalPushLeagueId);

      const res = await fetch(`${API_URL}/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: targetInfo.externalId,
          appSlug: targetInfo.appSlug,
          title: modalPushTitle.trim() || `📰 ${pushModalItem.title}`,
          body: modalPushBody.trim() || pushModalItem.description || '',
          imageUrl: pushModalItem.imageUrl || undefined,
          dataPayload: {
            type: 'news',
            id: String(pushModalItem.id),
            league_id: String(targetInfo.externalId || ''),
            app_slug: targetInfo.appSlug || ''
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Rich Push disparado com sucesso para ${targetInfo.appName} (${data.target || 'FCM'})!`);
        setPushModalItem(null);
      } else {
        showToast('error', data.error || data.message || 'Falha ao disparar Rich Push.');
      }
    } catch (e: any) {
      showToast('error', `Erro na requisição: ${e.message}`);
    } finally {
      setIsSendingModalPush(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

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
            Agente Publicador de Notícias com Rich Push
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Cole a URL de qualquer matéria e publique com extração automática de imagem, manchete e disparo simultâneo de Rich Push (BigPicture).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            MOTOR CRAWLER ATIVO
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            RICH PUSH (BIGPICTURE)
          </span>
        </div>
      </div>

      {/* Grid: Formulário + Preview / Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Formulário de Entrada */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121824] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Publicação & Disparo de Alerta
              </h2>
              {sendPushWithNews && (
                <button
                  type="button"
                  onClick={() => setShowLiveSimulator(!showLiveSimulator)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500/20 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {showLiveSimulator ? 'Ocultar Simulador' : 'Ver Simulador Lock Screen'}
                </button>
              )}
            </div>

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
                        {getLeagueDisplayName(league)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  💡 Roteia automaticamente o push para o aplicativo correspondente ({getAppNameForLeague(selectedLeagueId)}).
                </p>
              </div>

              {/* Toggle de Ajustes da Matéria */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                >
                  {showAdvanced ? '- Ocultar Edição Manual de Manchete/Lead' : '+ Personalizar Manchete / Lead (Opcional)'}
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Manchete Personalizada para a Matéria
                    </label>
                    <input
                      type="text"
                      value={overrideTitle}
                      onChange={(e) => setOverrideTitle(e.target.value)}
                      placeholder="Deixe em branco para extrair automaticamente do portal"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Resumo / Lead Personalizado para a Matéria
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

              {/* Bloco de Rich Push */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="sendPushToggle"
                      checked={sendPushWithNews}
                      onChange={(e) => setSendPushWithNews(e.target.checked)}
                      className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="sendPushToggle" className="text-xs font-bold text-white cursor-pointer select-none">
                      🔔 Disparar Rich Push com BigPicture ao Publicar
                    </label>
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                    FCM v1 / BigPicture
                  </span>
                </div>

                {sendPushWithNews && (
                  <div className="pt-2 border-t border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Destino: <strong>{getAppNameForLeague(selectedLeagueId)}</strong></span>
                      <button
                        type="button"
                        onClick={() => setShowPushCustomizer(!showPushCustomizer)}
                        className="text-indigo-400 hover:text-indigo-300 text-[11px] underline font-medium"
                      >
                        {showPushCustomizer ? 'Usar texto da matéria' : 'Personalizar texto do Push'}
                      </button>
                    </div>

                    {showPushCustomizer && (
                      <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-lg border border-indigo-500/20 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Título Chamativo do Push (ex: 🔥 URGENTE / REFORÇO NOVO)
                          </label>
                          <input
                            type="text"
                            value={customPushTitle}
                            onChange={(e) => setCustomPushTitle(e.target.value)}
                            placeholder="Ex: 🔥 REFORÇO CONFIRMADO NO CLUBE!"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Chamada Curta da Notificação (Lead do Push)
                          </label>
                          <input
                            type="text"
                            value={customPushBody}
                            onChange={(e) => setCustomPushBody(e.target.value)}
                            placeholder="Ex: Confira os bastidores e detalhes da contratação..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">
                      📸 A foto capturada na matéria será exibida nativamente na barra de notificações como <strong>BigPicture</strong>.
                    </p>
                  </div>
                )}
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
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extraindo Imagem e Processando Publicação...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {sendPushWithNews ? 'Publicar Matéria & Disparar Rich Push' : 'Capturar Foto & Publicar Notícia'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Simulador Lock Screen em Tempo Real (Inline quando ativado) */}
          {sendPushWithNews && showLiveSimulator && (
            <div className="bg-[#121824] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  Pré-visualização do Rich Push na Tela de Bloqueio
                </h3>
                <span className="text-[11px] text-slate-400">Tempo Real</span>
              </div>
              <PushSimulator
                title={customPushTitle || overrideTitle || "📰 Manchete da Notícia em Destaque"}
                body={customPushBody || overrideDescription || "Lead da matéria com resumo curto atraindo o torcedor para o aplicativo..."}
                imageUrl={successResult?.imageUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"}
                appName={getAppNameForLeague(selectedLeagueId)}
                timeAgo="Agora"
              />
            </div>
          )}

          {/* Card de Informações e Dicas */}
          <div className="bg-[#121824]/60 border border-white/5 rounded-xl p-4 text-xs text-white/60 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Como a Captura de Fotos e o Rich Push Funcionam:
            </div>
            <p>
              O robô utiliza os seletores OpenGraph (<code>og:image</code>) e Twitter Cards do portal oficial, garantindo imagens de alta resolução sem marcas d’água. Ao marcar o envio de push, o FCM envia a imagem no formato <strong>BigPicture</strong>, gerando visualização completa na tela bloqueada do usuário.
            </p>
          </div>
        </div>

        {/* Coluna Direita: Preview do Resultado e Histórico Recente */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preview da Notícia Recém-Publicada */}
          {successResult && (
            <div className="bg-[#121824] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Publicada no App!
                </div>
                <button
                  onClick={() => openPushModal(successResult)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Bell className="w-3.5 h-3.5 text-indigo-400" />
                  Disparar Push Agora
                </button>
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

          {/* Histórico Recente de Publicações com Ação de Rich Push */}
          <div className="bg-[#121824] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Últimas Notícias no Sistema
                </h3>
                <p className="text-[11px] text-white/40">Dispare Rich Push para qualquer matéria cadastrada</p>
              </div>
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
            ) : competitionGroups.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">
                Nenhuma notícia encontrada no momento.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {competitionGroups.map((group) => {
                  const isOpen = openAccordionKey === group.key;
                  const displayNews = group.news.slice(0, 10);

                  return (
                    <div
                      key={group.key}
                      className="border border-white/5 rounded-xl bg-white/[0.02] overflow-hidden transition-all duration-200"
                    >
                      {/* Cabeçalho da Sanfona */}
                      <button
                        type="button"
                        onClick={() => toggleAccordion(group.key)}
                        className={`w-full flex items-center justify-between p-3 transition-colors text-left select-none cursor-pointer ${
                          isOpen ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm flex-shrink-0">{group.icon}</span>
                          <span className="font-semibold text-xs text-white truncate">
                            {group.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              group.news.length > 0
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-white/5 text-white/30'
                            }`}
                          >
                            {group.news.length > 0 ? `${Math.min(group.news.length, 10)} de ${group.news.length}` : '0'}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-white/50 transition-transform duration-200 flex-shrink-0 ${
                            isOpen ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>

                      {/* Conteúdo Expandido da Sanfona (Últimas 10 notícias) */}
                      {isOpen && (
                        <div className="p-3 border-t border-white/5 space-y-2.5 bg-black/20 animate-fadeIn">
                          {displayNews.length === 0 ? (
                            <p className="text-[11px] text-white/40 text-center py-4 italic">
                              Nenhuma notícia recente cadastrada para esta competição.
                            </p>
                          ) : (
                            displayNews.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-all flex flex-col gap-2"
                              >
                                <div className="flex gap-2.5">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white/5"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white/20">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 text-[10px] text-white/40 mb-0.5">
                                      <span className="text-emerald-400 font-semibold truncate">
                                        {item.source || group.name}
                                      </span>
                                      <span>•</span>
                                      <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <h4 className="text-[11px] font-medium text-white/90 line-clamp-2 leading-tight">
                                      {item.title}
                                    </h4>
                                  </div>
                                </div>

                                {/* Barra de Ação de Disparo de Rich Push */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    ID: {item.id.slice(0, 8)}...
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openPushModal(item)}
                                    className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold flex items-center gap-1 transition-all"
                                  >
                                    <Bell className="w-3 h-3 text-indigo-400" />
                                    Disparar Rich Push
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação e Disparo de Rich Push com Simulador */}
      {pushModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121824] border border-indigo-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Disparo de Rich Push (BigPicture)</h3>
                  <p className="text-xs text-white/50">Confira a chamada e a foto antes de enviar aos torcedores</p>
                </div>
              </div>
              <button
                onClick={() => setPushModalItem(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Formulário do Push */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    App / Competição de Destino
                  </label>
                  <select
                    value={modalPushLeagueId}
                    onChange={(e) => setModalPushLeagueId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  >
                    <option value="">Geral / Detectar</option>
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {getLeagueDisplayName(l)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Título do Push
                  </label>
                  <input
                    type="text"
                    value={modalPushTitle}
                    onChange={(e) => setModalPushTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                    placeholder="Título da notificação"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Chamada Curta (Corpo)
                  </label>
                  <textarea
                    value={modalPushBody}
                    onChange={(e) => setModalPushBody(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                    placeholder="Texto do corpo da notificação"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    Destino do Rich Push & Deep Linking:
                  </div>
                  <p className="text-slate-300">
                    App Alvo: <span className="text-emerald-400 font-bold">{resolveLeagueInfo(modalPushLeagueId || (pushModalItem as any).league).appName}</span> {resolveLeagueInfo(modalPushLeagueId || (pushModalItem as any).league).appSlug ? <span className="text-indigo-400">({resolveLeagueInfo(modalPushLeagueId || (pushModalItem as any).league).appSlug})</span> : ''}
                  </p>
                  <p className="text-slate-400">
                    Ao tocar na notificação, o app abrirá direto a notícia ID: <code className="text-white font-mono">{pushModalItem.id.slice(0, 8)}</code>.
                  </p>
                </div>
              </div>

              {/* Simulador Lock Screen BigPicture */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Preview Lock Screen
                </span>
                <PushSimulator
                  title={modalPushTitle}
                  body={modalPushBody}
                  imageUrl={pushModalItem.imageUrl || undefined}
                  appName={resolveLeagueInfo(modalPushLeagueId || (pushModalItem as any).league).appName}
                  timeAgo="Agora"
                />
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPushModalItem(null)}
                disabled={isSendingModalPush}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendModalPush}
                disabled={isSendingModalPush}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {isSendingModalPush ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disparando Notificação...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirmar & Disparar Rich Push
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
