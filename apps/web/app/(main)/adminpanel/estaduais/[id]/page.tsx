"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Newspaper, 
  Video, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  X, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Search,
  Globe
} from "lucide-react";
import { useParams } from "next/navigation";
import { ECOSYSTEM_MODULES, LeagueConfig } from "../../registry";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

interface NewsItem {
  id: string;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  externalUrl?: string;
  imageUrl?: string;
  publishedAt?: string;
  leagueId?: string;
}

interface VideoItem {
  id: string;
  title: string;
  duration?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  leagueId?: string;
}

interface ScorerItem {
  id?: string;
  rank: number;
  playerName?: string;
  playerPhoto?: string;
  teamName?: string;
  teamLogo?: string;
  goals: number;
  assists?: number;
  player?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
}

export default function EstaduaisLeagueDetailPage() {
  const params = useParams();
  const leagueIdStr = (params?.id as string) || "";
  const leagueIdNum = parseInt(leagueIdStr, 10);

  // Informações da Liga
  const estaduaisModule = ECOSYSTEM_MODULES.find((m) => m.id === "estaduais");
  const leagueInfo: LeagueConfig | undefined = estaduaisModule?.leagues.find(
    (l) => l.id === leagueIdNum || l.slug === leagueIdStr
  );

  const leagueName = leagueInfo?.name || `Competição #${leagueIdStr}`;
  const leagueFlag = leagueInfo?.flag || "🇧🇷";
  const leagueCountry = leagueInfo?.country || "Brasil";

  // Estado da Aba Ativa: 'noticias' | 'videos' | 'artilharia'
  const [activeTab, setActiveTab] = useState<"noticias" | "videos" | "artilharia">("noticias");

  // Estados de Dados
  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [scorers, setScorers] = useState<ScorerItem[]>([]);
  
  // Loading states
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingScorers, setLoadingScorers] = useState(false);

  // Busca e Filtros gerais
  const [searchQuery, setSearchQuery] = useState("");

  // Modais de Vídeo
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: "",
    duration: "",
    videoUrl: "",
    thumbnailUrl: "",
  });
  const [submittingVideo, setSubmittingVideo] = useState(false);

  // Modais de Notícia
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [currentNewsId, setCurrentNewsId] = useState<string | null>(null);
  const [newsFormData, setNewsFormData] = useState({
    title: "",
    description: "",
    source: "",
    url: "",
    imageUrl: "",
  });
  const [submittingNews, setSubmittingNews] = useState(false);

  // Modais de Artilharia
  const [isScorerModalOpen, setIsScorerModalOpen] = useState(false);
  const [currentScorerId, setCurrentScorerId] = useState<string | null>(null);
  const [scorerFormData, setScorerFormData] = useState({
    rank: 1,
    playerName: "",
    playerPhoto: "",
    teamName: "",
    teamLogo: "",
    goals: 0,
  });
  const [submittingScorer, setSubmittingScorer] = useState(false);

  // UUID no banco Prisma (diferente de externalId)
  const [leagueUuid, setLeagueUuid] = useState<string | null>(null);

  // Efeitos de carregamento
  useEffect(() => {
    resolveLeagueUuidAndFetch();
  }, [leagueIdStr]);

  const resolveLeagueUuidAndFetch = async () => {
    let resolvedUuid: string | null = null;
    try {
      const res = await fetch(`${API_URL}/competitions/stored`);
      if (res.ok) {
        const leagues = await res.json();
        if (Array.isArray(leagues)) {
          const targetExtId = leagueInfo?.id || leagueIdNum;
          const match = leagues.find(
            (l: any) => l.externalId === targetExtId || l.id === leagueIdStr
          );
          if (match?.id) {
            resolvedUuid = match.id;
            setLeagueUuid(match.id);
          }
        }
      }
    } catch (e) {
      console.error("Erro ao buscar UUID da liga:", e);
    }

    fetchNews(resolvedUuid);
    fetchVideos(resolvedUuid);
    fetchScorers();
  };

  // Carregar Notícias filtradas por Liga
  const fetchNews = async (targetUuid?: string | null) => {
    try {
      setLoadingNews(true);
      const uuidToUse = targetUuid !== undefined ? targetUuid : leagueUuid;
      const queryParam = uuidToUse ? `leagueId=${uuidToUse}` : `leagueId=${leagueIdStr}`;
      const res = await fetch(`${API_URL}/news?limit=100&${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao buscar notícias:", e);
    } finally {
      setLoadingNews(false);
    }
  };

  // Carregar Vídeos filtrados por Liga
  const fetchVideos = async (targetUuid?: string | null) => {
    try {
      setLoadingVideos(true);
      const uuidToUse = targetUuid !== undefined ? targetUuid : leagueUuid;
      const queryParam = uuidToUse ? `leagueId=${uuidToUse}` : `leagueId=${leagueIdStr}`;
      const res = await fetch(`${API_URL}/videos?limit=100&${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao buscar vídeos:", e);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Carregar Artilharia da Liga
  const fetchScorers = async () => {
    try {
      setLoadingScorers(true);
      const res = await fetch(`${API_URL}/competitions/${leagueIdStr}/scorers?season=2026`);
      if (res.ok) {
        const data = await res.json();
        setScorers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao buscar artilharia:", e);
    } finally {
      setLoadingScorers(false);
    }
  };

  // --- HANDLERS DE VÍDEO ---
  const openVideoModal = (item: VideoItem | null = null) => {
    if (item) {
      setCurrentVideoId(item.id);
      setVideoFormData({
        title: item.title,
        duration: item.duration || "",
        videoUrl: item.videoUrl,
        thumbnailUrl: item.thumbnailUrl || "",
      });
    } else {
      setCurrentVideoId(null);
      setVideoFormData({ title: "", duration: "", videoUrl: "", thumbnailUrl: "" });
    }
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVideo(true);
    try {
      const url = currentVideoId ? `${API_URL}/videos/${currentVideoId}` : `${API_URL}/videos`;
      const method = currentVideoId ? "PUT" : "POST";
      const payload = {
        ...videoFormData,
        leagueId: leagueUuid || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsVideoModalOpen(false);
        fetchVideos();
      } else {
        alert("Erro ao salvar vídeo na API.");
      }
    } catch (e) {
      alert("Erro de conexão com a API.");
    } finally {
      setSubmittingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este vídeo da competição?")) return;
    try {
      await fetch(`${API_URL}/videos/${id}`, { method: "DELETE" });
      fetchVideos();
    } catch (e) {
      alert("Erro ao excluir vídeo.");
    }
  };

  // --- HANDLERS DE NOTÍCIA ---
  const openNewsModal = (item: NewsItem | null = null) => {
    if (item) {
      setCurrentNewsId(item.id);
      setNewsFormData({
        title: item.title || "",
        description: item.description || item.title || "",
        source: item.source || "",
        url: item.url || item.externalUrl || "",
        imageUrl: item.imageUrl || "",
      });
    } else {
      setCurrentNewsId(null);
      setNewsFormData({ title: "", description: "", source: "ZapScore", url: "", imageUrl: "" });
    }
    setIsNewsModalOpen(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNews(true);
    try {
      const url = currentNewsId ? `${API_URL}/news/${currentNewsId}` : `${API_URL}/news`;
      const method = currentNewsId ? "PUT" : "POST";
      const payload = {
        title: newsFormData.title,
        description: newsFormData.description || newsFormData.title,
        source: newsFormData.source || "ZapScore",
        imageUrl: newsFormData.imageUrl || null,
        externalUrl: newsFormData.url || null,
        leagueId: leagueUuid || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsNewsModalOpen(false);
        fetchNews();
      } else {
        alert("Erro ao salvar notícia na API.");
      }
    } catch (e) {
      alert("Erro de conexão com a API.");
    } finally {
      setSubmittingNews(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta notícia?")) return;
    try {
      await fetch(`${API_URL}/news/${id}`, { method: "DELETE" });
      fetchNews();
    } catch (e) {
      alert("Erro ao excluir notícia.");
    }
  };

  // --- HANDLERS DE ARTILHARIA ---
  const openScorerModal = (item: ScorerItem | null = null) => {
    if (item) {
      setCurrentScorerId(item.id || null);
      setScorerFormData({
        rank: item.rank ?? 1,
        playerName: item.playerName || item.player?.name || "",
        playerPhoto: item.playerPhoto || item.player?.photo || "",
        teamName: item.teamName || item.team?.name || "",
        teamLogo: item.teamLogo || item.team?.logo || "",
        goals: item.goals ?? 0,
      });
    } else {
      setCurrentScorerId(null);
      setScorerFormData({
        rank: scorers.length + 1,
        playerName: "",
        playerPhoto: "",
        teamName: "",
        teamLogo: "",
        goals: 0,
      });
    }
    setIsScorerModalOpen(true);
  };

  const handleSaveScorer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingScorer(true);
    try {
      const url = currentScorerId
        ? `${API_URL}/competitions/scorers/${currentScorerId}`
        : `${API_URL}/competitions/scorers`;
      const method = currentScorerId ? "PUT" : "POST";
      const payload = {
        rank: Number(scorerFormData.rank),
        playerName: scorerFormData.playerName,
        playerPhoto: scorerFormData.playerPhoto || null,
        teamName: scorerFormData.teamName,
        teamLogo: scorerFormData.teamLogo || null,
        goals: Number(scorerFormData.goals),
        leagueId: leagueUuid || leagueIdStr,
        season: 2026,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsScorerModalOpen(false);
        fetchScorers();
      } else {
        alert("Erro ao salvar artilheiro na API.");
      }
    } catch (e) {
      alert("Erro de conexão com a API.");
    } finally {
      setSubmittingScorer(false);
    }
  };

  const handleDeleteScorer = async (id?: string) => {
    if (!id) return;
    if (!confirm("Tem certeza que deseja remover este artilheiro?")) return;
    try {
      const res = await fetch(`${API_URL}/competitions/scorers/${id}`, { method: "DELETE" });
      if (res.ok) fetchScorers();
    } catch (e) {
      alert("Erro ao excluir artilheiro.");
    }
  };

  // Filtro de buscas local
  const filteredNews = news.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredScorers = scorers.filter((s) => {
    const pName = s.playerName || s.player?.name || "";
    const tName = s.teamName || s.team?.name || "";
    const q = searchQuery.toLowerCase();
    return pName.toLowerCase().includes(q) || tName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-[30px]" style={{ fontFamily: "var(--font-outfit)" }}>
      {/* Topo / Voltar */}
      <div className="flex items-center gap-4">
        <Link
          href="/adminpanel/estaduais"
          className="p-2.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white transition-all border border-[var(--border)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          Módulo Estaduais / Competições
        </span>
      </div>

      {/* Header do Campeonato */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-4xl shrink-0 shadow-lg">
            {leagueFlag}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-black text-white">{leagueName}</h1>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--surface-hover)] text-emerald-400 border border-emerald-500/30">
                ID: {leagueIdStr}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              País: <strong className="text-white">{leagueCountry}</strong> • Gestão e estatísticas da liga
            </p>
          </div>
        </div>

        {/* Estatísticas resumidas da Liga */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Notícias</p>
            <p className="text-lg font-black text-white">{news.length}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Vídeos</p>
            <p className="text-lg font-black text-red-400">{videos.length}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Artilheiros</p>
            <p className="text-lg font-black text-amber-400">{scorers.length}</p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas + Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab("noticias")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "noticias"
                ? "bg-[var(--primary)] text-black shadow-lg"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
            }`}
          >
            <Newspaper size={18} />
            <span>Notícias</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {news.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "videos"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
            }`}
          >
            <Video size={18} />
            <span>Vídeos & Highlights</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {videos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("artilharia")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "artilharia"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
            }`}
          >
            <Trophy size={18} />
            <span>Artilharia</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {scorers.length}
            </span>
          </button>
        </div>

        {/* Input de Pesquisa */}
        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar nesta aba..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* --- ABA NOTÍCIAS --- */}
      {activeTab === "noticias" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Newspaper size={20} className="text-[var(--primary)]" />
                <span>Notícias da {leagueName}</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Notícias associadas a esta competição
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchNews()}
                className="p-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white rounded-xl transition-all border border-[var(--border)]"
                title="Atualizar Notícias"
              >
                <RefreshCw size={18} className={loadingNews ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => openNewsModal()}
                className="bg-[var(--primary)] text-black px-5 py-3 rounded-xl font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus size={18} />
                <span>INSERIR NOTÍCIA</span>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4">Matéria</th>
                    <th className="p-4">Fonte</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingNews ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando notícias da competição...
                      </td>
                    </tr>
                  ) : filteredNews.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhuma notícia encontrada para esta competição.
                      </td>
                    </tr>
                  ) : (
                    filteredNews.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-12 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Newspaper size={18} className="text-[var(--text-muted)]" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm line-clamp-1">{item.title}</p>
                              {item.publishedAt && (
                                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                  {new Date(item.publishedAt).toLocaleDateString("pt-BR")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[var(--text-muted)] font-medium">
                          {item.source || "Geral"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {item.url && (
                              <button
                                onClick={() => window.open(item.url, "_blank")}
                                className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"
                                title="Abrir Link"
                              >
                                <ExternalLink size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => openNewsModal(item)}
                              className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all"
                              title="Editar Notícia"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteNews(item.id)}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                              title="Excluir Notícia"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ABA VÍDEOS --- */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Video size={20} className="text-red-500" />
                <span>Vídeos & Destaques da {leagueName}</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Exibidos no feed da aba Watch no aplicativo da competição
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchVideos()}
                className="p-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white rounded-xl transition-all border border-[var(--border)]"
                title="Atualizar Vídeos"
              >
                <RefreshCw size={18} className={loadingVideos ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => openVideoModal()}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
              >
                <Plus size={18} />
                <span>CADASTRAR VÍDEO</span>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4">Vídeo / Highlight</th>
                    <th className="p-4">Duração</th>
                    <th className="p-4 text-right">Controles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingVideos ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando vídeos da competição...
                      </td>
                    </tr>
                  ) : filteredVideos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhum vídeo cadastrado para esta competição.
                      </td>
                    </tr>
                  ) : (
                    filteredVideos.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-14 rounded-lg bg-black/50 border border-[var(--border)] overflow-hidden shrink-0 relative">
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Video className="m-4 text-[var(--text-muted)]" />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play size={16} className="text-white fill-current" />
                              </div>
                            </div>
                            <p className="font-bold text-white text-sm line-clamp-2">{item.title}</p>
                          </div>
                        </td>
                        <td className="p-4 text-[var(--text-muted)] font-mono font-bold">
                          {item.duration || "00:00"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => window.open(item.videoUrl, "_blank")}
                              className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"
                              title="Assistir Vídeo"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button
                              onClick={() => openVideoModal(item)}
                              className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all"
                              title="Editar Vídeo"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(item.id)}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                              title="Excluir Vídeo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ABA ARTILHARIA --- */}
      {activeTab === "artilharia" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" />
                <span>Artilharia Principal ({leagueName})</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Ranking de marcadores de gols da temporada atual
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchScorers}
                className="p-3 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white rounded-xl transition-all border border-[var(--border)]"
                title="Atualizar Artilharia"
              >
                <RefreshCw size={18} className={loadingScorers ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => openScorerModal()}
                className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus size={18} />
                <span>NOVO ARTILHEIRO</span>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4 w-16 text-center">POS</th>
                    <th className="p-4">Jogador</th>
                    <th className="p-4">Clube</th>
                    <th className="p-4 text-center">Gols</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingScorers ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando artilharia da liga...
                      </td>
                    </tr>
                  ) : filteredScorers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhum artilheiro registrado para esta temporada.
                      </td>
                    </tr>
                  ) : (
                    filteredScorers.map((item, idx) => {
                      const pName = item.playerName || item.player?.name || "Jogador";
                      const pPhoto = item.playerPhoto || item.player?.photo;
                      const tName = item.teamName || item.team?.name || "Clube";
                      const tLogo = item.teamLogo || item.team?.logo;
                      const posRank = item.rank ?? (idx + 1);

                      return (
                        <tr key={item.id || idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="p-4 text-center font-bold font-mono text-[var(--text-muted)]">
                            {posRank}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                                {pPhoto ? (
                                  <img src={pPhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-bold text-xs text-[var(--text-muted)]">
                                    {pName.substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-white text-sm">{pName}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {tLogo && (
                                <img src={tLogo} alt="" className="w-5 h-5 object-contain" />
                              )}
                              <span className="text-[var(--text-muted)] font-medium">{tName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-black text-amber-400 text-sm font-mono">
                            {item.goals}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openScorerModal(item)}
                                className="p-2.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-white rounded-lg transition-all"
                                title="Editar Artilheiro"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteScorer(item.id)}
                                className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                                title="Excluir Artilheiro"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE INSERIR / EDITAR ARTILHEIRO --- */}
      {isScorerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <Trophy size={20} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {currentScorerId ? "Editar Artilheiro" : `Novo Artilheiro — ${leagueName}`}
                </h3>
              </div>
              <button
                onClick={() => setIsScorerModalOpen(false)}
                className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveScorer} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Posição no Ranking (rank) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="admin-input font-mono"
                      value={scorerFormData.rank}
                      onChange={(e) =>
                        setScorerFormData({ ...scorerFormData, rank: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div>
                    <label className="admin-label">Gols (goals) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="admin-input font-mono text-amber-400 font-bold"
                      value={scorerFormData.goals}
                      onChange={(e) =>
                        setScorerFormData({ ...scorerFormData, goals: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-label">Nome do Jogador (playerName) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Harry Kane"
                    className="admin-input"
                    value={scorerFormData.playerName}
                    onChange={(e) =>
                      setScorerFormData({ ...scorerFormData, playerName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="admin-label">Foto do Jogador URL (playerPhoto)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={scorerFormData.playerPhoto}
                    onChange={(e) =>
                      setScorerFormData({ ...scorerFormData, playerPhoto: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="admin-label">Nome do Clube (teamName) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bayern München"
                    className="admin-input"
                    value={scorerFormData.teamName}
                    onChange={(e) =>
                      setScorerFormData({ ...scorerFormData, teamName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="admin-label">Logo do Clube URL (teamLogo)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={scorerFormData.teamLogo}
                    onChange={(e) =>
                      setScorerFormData({ ...scorerFormData, teamLogo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsScorerModalOpen(false)}
                  className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submittingScorer}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50"
                >
                  {submittingScorer ? "SALVANDO..." : "SALVAR ARTILHEIRO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE INSERIR / EDITAR VÍDEO --- */}
      {isVideoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Video size={18} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {currentVideoId ? "Editar Vídeo" : `Novo Vídeo — ${leagueName}`}
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                <div>
                  <label className="admin-label">Título do Vídeo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Melhores Momentos - Bayern vs Dortmund"
                    className="admin-input"
                    value={videoFormData.title}
                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Duração (Ex: 04:30)</label>
                    <input
                      type="text"
                      placeholder="00:00"
                      className="admin-input font-mono"
                      value={videoFormData.duration}
                      onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Competição</label>
                    <input
                      type="text"
                      disabled
                      value={`${leagueName} (ID: ${leagueIdStr})`}
                      className="admin-input text-[var(--text-muted)] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-label">URL da Thumbnail (Imagem)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={videoFormData.thumbnailUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, thumbnailUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">URL do Vídeo (YouTube ou MP4) *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="admin-input font-mono"
                    value={videoFormData.videoUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, videoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submittingVideo}
                  className="bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {submittingVideo ? "SALVANDO..." : "SALVAR VÍDEO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE INSERIR / EDITAR NOTÍCIA --- */}
      {isNewsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                  <Newspaper size={18} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {currentNewsId ? "Editar Notícia" : `Nova Notícia — ${leagueName}`}
                </h3>
              </div>
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNews} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                <div>
                  <label className="admin-label">Título da Notícia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bayern contrata novo reforço para a temporada"
                    className="admin-input"
                    value={newsFormData.title}
                    onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Resumo / Descrição</label>
                  <input
                    type="text"
                    placeholder="Resumo da matéria..."
                    className="admin-input"
                    value={newsFormData.description}
                    onChange={(e) => setNewsFormData({ ...newsFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Fonte / Portal</label>
                    <input
                      type="text"
                      placeholder="Ex: Bild / Kicker"
                      className="admin-input"
                      value={newsFormData.source}
                      onChange={(e) => setNewsFormData({ ...newsFormData, source: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Competição</label>
                    <input
                      type="text"
                      disabled
                      value={`${leagueName} (ID: ${leagueIdStr})`}
                      className="admin-input text-[var(--text-muted)] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-label">URL da Imagem de Capa</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={newsFormData.imageUrl}
                    onChange={(e) => setNewsFormData({ ...newsFormData, imageUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Link Externo da Notícia</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={newsFormData.url}
                    onChange={(e) => setNewsFormData({ ...newsFormData, url: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submittingNews}
                  className="bg-[var(--primary)] text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg disabled:opacity-50"
                >
                  {submittingNews ? "SALVANDO..." : "SALVAR NOTÍCIA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
