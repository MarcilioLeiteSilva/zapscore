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
  Globe,
  Users,
  CheckCircle2,
  AlertCircle,
  Camera,
  Image as ImageIcon
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

interface PlayerItem {
  id: number;
  name: string;
  number?: number | null;
  position?: string;
  age?: number | null;
  photo?: string | null;
  teamId?: string;
  teamExternalId?: number;
  teamName?: string;
  teamLogo?: string | null;
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

  // Estado da Aba Ativa: 'noticias' | 'videos' | 'artilharia' | 'jogadores'
  const [activeTab, setActiveTab] = useState<"noticias" | "videos" | "artilharia" | "jogadores">("noticias");

  // Estados de Dados
  const [news, setNews] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [scorers, setScorers] = useState<ScorerItem[]>([]);
  const [players, setPlayers] = useState<PlayerItem[]>([]);

  // Temporada Selecionada (Padrão 2027 para Pernambucano, Tocantinense, Baiano, Cearense, Sul-Matogrossense, Amapaense)
  const is2027League = ["622", "631", "602", "609", "623", "521"].includes(leagueIdStr) || [622, 631, 602, 609, 623, 521].includes(leagueIdNum);
  const defaultSeason = is2027League ? 2027 : 2026;
  const [selectedSeason, setSelectedSeason] = useState<number>(defaultSeason);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>(
    is2027League ? [2027, 2026] : [2026]
  );
  
  // Loading states
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingScorers, setLoadingScorers] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Estados e Filtros de Jogadores
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [onlyMissingPhotos, setOnlyMissingPhotos] = useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerItem | null>(null);
  const [playerPhotoInput, setPlayerPhotoInput] = useState("");
  const [submittingPlayerPhoto, setSubmittingPlayerPhoto] = useState(false);

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
    fetchScorers(defaultSeason);
    fetchPlayers(defaultSeason);
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

  // Buscar temporadas disponíveis da liga
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await fetch(`${API_URL}/competitions/${leagueIdStr}/seasons`);
        if (res.ok) {
          const seasons = await res.json();
          if (Array.isArray(seasons) && seasons.length > 0) {
            setAvailableSeasons(seasons);
            if (!seasons.includes(selectedSeason)) {
              setSelectedSeason(seasons[0]);
              fetchScorers(seasons[0]);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao buscar temporadas da competição:", err);
      }
    };
    if (leagueIdStr) {
      fetchSeasons();
    }
  }, [leagueIdStr]);

  // Carregar Artilharia da Liga
  const fetchScorers = async (seasonToFetch?: number) => {
    try {
      setLoadingScorers(true);
      const targetSeason = seasonToFetch ?? selectedSeason;
      const res = await fetch(`${API_URL}/competitions/${leagueIdStr}/scorers?season=${targetSeason}`);
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

  // Carregar Jogadores da Liga
  const fetchPlayers = async (seasonToFetch?: number) => {
    try {
      setLoadingPlayers(true);
      const targetSeason = seasonToFetch ?? selectedSeason;
      const res = await fetch(`${API_URL}/competitions/${leagueIdStr}/players?season=${targetSeason}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao buscar jogadores:", e);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleSelectSeason = (season: number) => {
    setSelectedSeason(season);
    fetchScorers(season);
    fetchPlayers(season);
  };

  // --- HANDLERS DE JOGADORES ---
  const handleOpenEditPlayerModal = (player: PlayerItem) => {
    setEditingPlayer(player);
    setPlayerPhotoInput(player.photo || "");
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayerPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    try {
      setSubmittingPlayerPhoto(true);
      const res = await fetch(`${API_URL}/competitions/players/${editingPlayer.id}/photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo: playerPhotoInput.trim(),
          teamExternalId: editingPlayer.teamExternalId,
          playerName: editingPlayer.name,
        }),
      });
      if (res.ok) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === editingPlayer.id
              ? { ...p, photo: playerPhotoInput.trim() || null }
              : p
          )
        );
        setIsPlayerModalOpen(false);
        setEditingPlayer(null);
      }
    } catch (e) {
      console.error("Erro ao salvar foto do atleta:", e);
    } finally {
      setSubmittingPlayerPhoto(false);
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
        season: selectedSeason,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsScorerModalOpen(false);
        fetchScorers(selectedSeason);
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
      if (res.ok) fetchScorers(selectedSeason);
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

  const filteredPlayers = players.filter((player) => {
    if (selectedTeamFilter !== "all" && player.teamName !== selectedTeamFilter) {
      return false;
    }
    if (onlyMissingPhotos && player.photo && player.photo.trim().length > 5) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(q) ||
      (player.teamName && player.teamName.toLowerCase().includes(q)) ||
      (player.position && player.position.toLowerCase().includes(q))
    );
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
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Jogadores</p>
            <p className="text-lg font-black text-blue-400">{players.length}</p>
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

          <button
            onClick={() => setActiveTab("jogadores")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === "jogadores"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
            }`}
          >
            <Users size={18} />
            <span>Jogadores</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {players.length}
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" />
                <span>Artilharia Principal ({leagueName})</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Ranking de marcadores de gols da temporada {selectedSeason}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {availableSeasons.length > 1 && (
                <div className="flex items-center gap-1.5 bg-[var(--surface-hover)] border border-[var(--border)] p-1 rounded-xl">
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold px-2 uppercase tracking-wider">
                    Temporada:
                  </span>
                  {availableSeasons.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSelectSeason(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSeason === s
                          ? "bg-amber-500 text-black shadow-md font-extrabold"
                          : "text-[var(--text-muted)] hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => fetchScorers(selectedSeason)}
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

      {/* --- ABA JOGADORES --- */}
      {activeTab === "jogadores" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-blue-400" />
                <span>Plantel e Fotos dos Atletas</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Gestão dos elencos, conferência de fotos oficiais e inserção manual para enriquecimento de cards.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seleção de Temporada */}
              {availableSeasons.length > 1 && (
                <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border)]">
                  {availableSeasons.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSelectSeason(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSeason === s
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "text-[var(--text-muted)] hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Botão de Atualizar Lista */}
              <button
                onClick={() => fetchPlayers()}
                disabled={loadingPlayers}
                className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl hover:text-white"
                title="Recarregar atletas"
              >
                <RefreshCw size={14} className={loadingPlayers ? "animate-spin" : ""} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Filtros de Clubes e Fotos */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Clube */}
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Todos os Clubes ({players.length} atletas)</option>
                {Array.from(new Set(players.map((p) => p.teamName).filter(Boolean))).map((tName) => {
                  const count = players.filter((p) => p.teamName === tName).length;
                  return (
                    <option key={tName} value={tName as string}>
                      {tName} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Filtro Sem Foto */}
              <button
                onClick={() => setOnlyMissingPhotos(!onlyMissingPhotos)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  onlyMissingPhotos
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-white"
                }`}
              >
                <AlertCircle size={14} />
                <span>Apenas Sem Foto</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                  {players.filter((p) => !p.photo).length}
                </span>
              </button>
            </div>

            <div className="text-xs text-[var(--text-muted)] font-mono self-center">
              Mostrando {filteredPlayers.length} de {players.length} atletas
            </div>
          </div>

          {/* Tabela de Jogadores */}
          <div className="card overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--surface-hover)]/50">
                    <th className="p-4 w-16 text-center">Foto</th>
                    <th className="p-4">Atleta</th>
                    <th className="p-4">Clube</th>
                    <th className="p-4">Posição</th>
                    <th className="p-4">Idade</th>
                    <th className="p-4 text-center">Status Foto</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingPlayers ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-[var(--text-muted)]">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                          <p className="text-xs font-medium">Carregando plantel da competição...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-[var(--text-muted)]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users size={32} className="opacity-40" />
                          <p className="text-sm font-bold text-white">Nenhum jogador encontrado</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {onlyMissingPhotos
                              ? "Todos os jogadores deste filtro possuem fotos cadastradas."
                              : "Nenhum atleta corresponde aos critérios de busca ou a liga ainda não possui plantéis sincronizados."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player) => {
                      const hasPhoto = Boolean(player.photo && player.photo.trim().length > 5);
                      return (
                        <tr key={player.id} className="hover:bg-[var(--surface-hover)]/30 transition-colors">
                          <td className="p-4 text-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface-hover)] border border-[var(--border)] mx-auto flex items-center justify-center shrink-0">
                              {hasPhoto ? (
                                <img
                                  src={player.photo!}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-xs text-[var(--text-muted)]">
                                  {player.name.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                                {player.name}
                                {player.number && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-zinc-300">
                                    #{player.number}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                ID: {player.id}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {player.teamLogo && (
                                <img src={player.teamLogo} alt="" className="w-5 h-5 object-contain" />
                              )}
                              <span className="text-[var(--text-muted)] text-xs font-medium">
                                {player.teamName || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-zinc-300 font-medium">
                              {player.position}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-mono text-[var(--text-muted)]">
                            {player.age ? `${player.age} anos` : "—"}
                          </td>
                          <td className="p-4 text-center">
                            {hasPhoto ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <CheckCircle2 size={12} />
                                <span>Com Foto</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                                <AlertCircle size={12} />
                                <span>Sem Foto</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenEditPlayerModal(player)}
                              className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                            >
                              <Camera size={14} />
                              <span>{hasPhoto ? "Alterar Foto" : "Inserir Foto"}</span>
                            </button>
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
                  {currentScorerId ? "Editar Artilheiro" : `Novo Artilheiro (Temporada ${selectedSeason}) — ${leagueName}`}
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

      {/* --- MODAL EDITAR FOTO DO JOGADOR --- */}
      {isPlayerModalOpen && editingPlayer && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200 max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <Camera size={20} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Editar Foto do Atleta</h3>
              </div>
              <button
                onClick={() => setIsPlayerModalOpen(false)}
                className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlayerPhoto} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                {/* Perfil Rápido do Jogador */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 border border-[var(--border)] shrink-0 flex items-center justify-center">
                    {playerPhotoInput.trim() ? (
                      <img
                        src={playerPhotoInput.trim()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="font-bold text-sm text-[var(--text-muted)]">
                        {editingPlayer.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{editingPlayer.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                      {editingPlayer.teamLogo && (
                        <img src={editingPlayer.teamLogo} alt="" className="w-3.5 h-3.5 object-contain" />
                      )}
                      <span>{editingPlayer.teamName}</span> • <span>{editingPlayer.position}</span>
                      {editingPlayer.number && <span>(#{editingPlayer.number})</span>}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="admin-label">URL da Foto Oficial *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.ogol.com.br/img/jogadores/... ou https://..."
                    className="admin-input font-mono text-xs"
                    value={playerPhotoInput}
                    onChange={(e) => setPlayerPhotoInput(e.target.value)}
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    Insira a URL direta da foto oficial (ex: do oGol, Federação ou CDN). A imagem será atualizada imediatamente no card do atleta e escalações.
                  </p>
                </div>

                {/* Pré-visualização da imagem */}
                {playerPhotoInput.trim() && (
                  <div className="p-3.5 rounded-xl bg-black/30 border border-[var(--border)] text-center">
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-2">Pré-visualização</p>
                    <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto border border-blue-500/40 shadow-lg">
                      <img
                        src={playerPhotoInput.trim()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23222"/><text x="40" y="45" font-size="10" fill="%23999" text-anchor="middle">URL Inválida</text></svg>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submittingPlayerPhoto || !playerPhotoInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingPlayerPhoto && <Loader2 size={14} className="animate-spin" />}
                  <span>{submittingPlayerPhoto ? "SALVANDO..." : "SALVAR FOTO"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
