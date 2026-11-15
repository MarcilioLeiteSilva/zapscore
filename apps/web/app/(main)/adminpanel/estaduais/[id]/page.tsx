"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Image as ImageIcon,
  CheckSquare,
  Square
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
  isDraft?: boolean;
  status?: string;
}

interface VideoItem {
  id: string;
  title: string;
  duration?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  leagueId?: string;
  isDraft?: boolean;
  status?: string;
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

  // Modal completo de Jogadores (Inserção e Edição completa)
  const [isPlayerCrudModalOpen, setIsPlayerCrudModalOpen] = useState(false);
  const [isEditingPlayerMode, setIsEditingPlayerMode] = useState(false);
  const [playerFormData, setPlayerFormData] = useState({
    id: 0,
    name: "",
    position: "Atacante",
    number: "",
    age: "",
    photo: "",
    teamExternalId: 0,
  });
  const [submittingPlayer, setSubmittingPlayer] = useState(false);

  // Filtros de Publicado / Rascunho
  const [newsStatusFilter, setNewsStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [videoStatusFilter, setVideoStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Seleção em lote para exclusão
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());

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
    status: "published" as "published" | "draft",
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
    status: "published" as "published" | "draft",
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

  // Carregar Notícias filtradas por Liga (incluindo rascunhos para o painel de controle)
  const fetchNews = async (targetUuid?: string | null) => {
    try {
      setLoadingNews(true);
      const uuidToUse = targetUuid !== undefined ? targetUuid : leagueUuid;
      const queryParam = uuidToUse ? `leagueId=${uuidToUse}` : `leagueId=${leagueIdStr}`;
      const res = await fetch(`${API_URL}/news?limit=100&includeDrafts=true&${queryParam}`);
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

  // Carregar Vídeos filtrados por Liga (incluindo rascunhos para o painel de controle)
  const fetchVideos = async (targetUuid?: string | null) => {
    try {
      setLoadingVideos(true);
      const uuidToUse = targetUuid !== undefined ? targetUuid : leagueUuid;
      const queryParam = uuidToUse ? `leagueId=${uuidToUse}` : `leagueId=${leagueIdStr}`;
      const res = await fetch(`${API_URL}/videos?limit=100&includeDrafts=true&${queryParam}`);
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

  // --- HANDLERS COMPLETOS DE JOGADORES (CRUD) ---
  const handleOpenCreatePlayerModal = () => {
    setIsEditingPlayerMode(false);
    const defaultTeamExtId = availableClubs.length > 0 ? availableClubs[0].externalId : 0;
    setPlayerFormData({
      id: 0,
      name: "",
      position: "Atacante",
      number: "",
      age: "",
      photo: "",
      teamExternalId: defaultTeamExtId,
    });
    setIsPlayerCrudModalOpen(true);
  };

  const handleOpenEditPlayerModal = (player: PlayerItem) => {
    setIsEditingPlayerMode(true);
    setPlayerFormData({
      id: player.id,
      name: player.name || "",
      position: player.position || "Atacante",
      number: player.number ? String(player.number) : "",
      age: player.age ? String(player.age) : "",
      photo: player.photo || "",
      teamExternalId: player.teamExternalId || 0,
    });
    setIsPlayerCrudModalOpen(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerFormData.name.trim()) {
      alert("Nome do jogador é obrigatório.");
      return;
    }
    setSubmittingPlayer(true);
    try {
      const url = isEditingPlayerMode
        ? `${API_URL}/competitions/players/${playerFormData.id}`
        : `${API_URL}/competitions/players`;
      const method = isEditingPlayerMode ? "PUT" : "POST";
      const payload = {
        name: playerFormData.name.trim(),
        position: playerFormData.position,
        number: playerFormData.number ? parseInt(String(playerFormData.number), 10) : null,
        age: playerFormData.age ? parseInt(String(playerFormData.age), 10) : null,
        photo: playerFormData.photo.trim() || null,
        teamExternalId: Number(playerFormData.teamExternalId),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsPlayerCrudModalOpen(false);
        fetchPlayers(selectedSeason);
      } else {
        alert("Erro ao salvar atleta na API.");
      }
    } catch (err) {
      alert("Erro de conexão ao salvar atleta.");
    } finally {
      setSubmittingPlayer(false);
    }
  };

  const handleDeletePlayer = async (player: PlayerItem) => {
    if (!confirm(`Deseja realmente excluir o atleta "${player.name}" do plantel?`)) return;
    try {
      const query = player.teamExternalId ? `?teamExternalId=${player.teamExternalId}` : "";
      const res = await fetch(`${API_URL}/competitions/players/${player.id}${query}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      } else {
        alert("Erro ao excluir atleta.");
      }
    } catch (err) {
      alert("Erro de conexão ao excluir atleta.");
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
        status: item.isDraft ? "draft" : "published",
      });
    } else {
      setCurrentVideoId(null);
      setVideoFormData({ title: "", duration: "", videoUrl: "", thumbnailUrl: "", status: "published" });
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

  const handleToggleVideoStatus = async (item: VideoItem) => {
    const newStatus = item.isDraft ? "published" : "draft";
    try {
      const res = await fetch(`${API_URL}/videos/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === item.id
              ? { ...v, isDraft: newStatus === "draft", status: newStatus }
              : v
          )
        );
      }
    } catch (e) {
      alert("Erro ao alterar status do vídeo.");
    }
  };

  const handleBulkDeleteVideos = async () => {
    if (selectedVideoIds.size === 0) return;
    if (!confirm(`Deseja excluir permanentemente os ${selectedVideoIds.size} vídeos selecionados?`)) return;
    try {
      const res = await fetch(`${API_URL}/videos/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedVideoIds) }),
      });
      if (res.ok) {
        setSelectedVideoIds(new Set());
        fetchVideos();
      } else {
        alert("Erro ao excluir vídeos em lote.");
      }
    } catch (e) {
      alert("Erro de conexão com a API.");
    }
  };

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVideos = () => {
    if (selectedVideoIds.size >= filteredVideos.length && filteredVideos.length > 0) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(filteredVideos.map((v) => v.id)));
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
        status: item.isDraft ? "draft" : "published",
      });
    } else {
      setCurrentNewsId(null);
      setNewsFormData({ title: "", description: "", source: "ZapScore", url: "", imageUrl: "", status: "published" });
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
        status: newsFormData.status,
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

  const handleToggleNewsStatus = async (item: NewsItem) => {
    const newStatus = item.isDraft ? "published" : "draft";
    try {
      const res = await fetch(`${API_URL}/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setNews((prev) =>
          prev.map((n) =>
            n.id === item.id
              ? { ...n, isDraft: newStatus === "draft", status: newStatus }
              : n
          )
        );
      }
    } catch (e) {
      alert("Erro ao alterar status da notícia.");
    }
  };

  const handleBulkDeleteNews = async () => {
    if (selectedNewsIds.size === 0) return;
    if (!confirm(`Deseja excluir permanentemente as ${selectedNewsIds.size} notícias selecionadas?`)) return;
    try {
      const res = await fetch(`${API_URL}/news/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedNewsIds) }),
      });
      if (res.ok) {
        setSelectedNewsIds(new Set());
        fetchNews();
      } else {
        alert("Erro ao excluir notícias em lote.");
      }
    } catch (e) {
      alert("Erro de conexão com a API.");
    }
  };

  const toggleSelectNews = (id: string) => {
    setSelectedNewsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllNews = () => {
    if (selectedNewsIds.size >= filteredNews.length && filteredNews.length > 0) {
      setSelectedNewsIds(new Set());
    } else {
      setSelectedNewsIds(new Set(filteredNews.map((n) => n.id)));
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

  // Lista Canônica de Clubes do Amapaense (ID 521)
  const AMAPAENSE_CANONICAL_CLUBS = [
    { externalId: 2224, name: "Trem Desportivo Clube" },
    { externalId: 7785, name: "Santos Futebol Clube do Amapá" },
    { externalId: 10858, name: "Oratório Recreativo Clube" },
    { externalId: 10861, name: "Independente Esporte Clube" },
    { externalId: 7848, name: "Ypiranga Clube" },
    { externalId: 270734, name: "Portuguesa de Desporto do Amapá" },
    { externalId: 78216, name: "Rio Norte Futebol Clube" },
    { externalId: 15622, name: "SER São José" },
  ];

  const availableClubs = useMemo(() => {
    const clubMap = new Map<string, { externalId: number; name: string }>();
    if (leagueIdNum === 521 || leagueIdStr === "521") {
      for (const c of AMAPAENSE_CANONICAL_CLUBS) {
        clubMap.set(c.name, c);
      }
    }
    for (const p of players) {
      if (p.teamName) {
        clubMap.set(p.teamName, {
          externalId: p.teamExternalId || 0,
          name: p.teamName,
        });
      }
    }
    return Array.from(clubMap.values());
  }, [players, leagueIdNum, leagueIdStr]);

  // Filtro de buscas local com suporte a Publicado / Rascunho
  const filteredNews = news.filter((n) => {
    if (newsStatusFilter === "published" && n.isDraft) return false;
    if (newsStatusFilter === "draft" && !n.isDraft) return false;
    if (!searchQuery) return true;
    return n.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredVideos = videos.filter((v) => {
    if (videoStatusFilter === "published" && v.isDraft) return false;
    if (videoStatusFilter === "draft" && !v.isDraft) return false;
    if (!searchQuery) return true;
    return v.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Newspaper size={20} className="text-[var(--primary)]" />
                <span>Notícias da {leagueName}</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Notícias associadas a esta competição • Controle editorial de publicação e exclusão em lote
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Botão de Excluir em Lote quando houver selecionados */}
              {selectedNewsIds.size > 0 && (
                <button
                  onClick={handleBulkDeleteNews}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 animate-in fade-in"
                >
                  <Trash2 size={16} />
                  <span>Excluir Selecionados ({selectedNewsIds.size})</span>
                </button>
              )}

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

          {/* Barra de Filtro de Publicado / Rascunho */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-hover)]/40 p-3 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase mr-1">Status:</span>
              <button
                onClick={() => setNewsStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  newsStatusFilter === "all"
                    ? "bg-[var(--primary)] text-black shadow-md"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
                }`}
              >
                Todos ({news.length})
              </button>
              <button
                onClick={() => setNewsStatusFilter("published")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  newsStatusFilter === "published"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "bg-[var(--surface-hover)] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Publicados ({news.filter((n) => !n.isDraft).length})</span>
              </button>
              <button
                onClick={() => setNewsStatusFilter("draft")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  newsStatusFilter === "draft"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "bg-[var(--surface-hover)] text-amber-400 border border-amber-500/30 hover:bg-amber-500/10"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Rascunhos ({news.filter((n) => n.isDraft).length})</span>
              </button>
            </div>

            <div className="text-xs text-[var(--text-muted)] font-mono">
              Mostrando {filteredNews.length} de {news.length}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={filteredNews.length > 0 && selectedNewsIds.size === filteredNews.length}
                        onChange={toggleSelectAllNews}
                        className="rounded border-[var(--border)] cursor-pointer"
                        title="Selecionar todos"
                      />
                    </th>
                    <th className="p-4">Matéria</th>
                    <th className="p-4">Fonte</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingNews ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando notícias da competição...
                      </td>
                    </tr>
                  ) : filteredNews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhuma notícia encontrada para esta competição com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredNews.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedNewsIds.has(item.id)}
                            onChange={() => toggleSelectNews(item.id)}
                            className="rounded border-[var(--border)] cursor-pointer"
                          />
                        </td>
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
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleNewsStatus(item)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 transition-all ${
                              item.isDraft
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                            title="Clique para alternar Publicado / Rascunho"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isDraft ? "bg-amber-400" : "bg-emerald-400"}`} />
                            <span>{item.isDraft ? "Rascunho" : "Publicado"}</span>
                          </button>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Video size={20} className="text-red-500" />
                <span>Vídeos & Destaques da {leagueName}</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Exibidos no feed da aba Watch no aplicativo • Controle editorial de publicação e exclusão em lote
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Botão de Excluir em Lote quando houver selecionados */}
              {selectedVideoIds.size > 0 && (
                <button
                  onClick={handleBulkDeleteVideos}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 animate-in fade-in"
                >
                  <Trash2 size={16} />
                  <span>Excluir Selecionados ({selectedVideoIds.size})</span>
                </button>
              )}

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

          {/* Barra de Filtro de Publicado / Rascunho */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-hover)]/40 p-3 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase mr-1">Status:</span>
              <button
                onClick={() => setVideoStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  videoStatusFilter === "all"
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
                }`}
              >
                Todos ({videos.length})
              </button>
              <button
                onClick={() => setVideoStatusFilter("published")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  videoStatusFilter === "published"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "bg-[var(--surface-hover)] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Publicados ({videos.filter((v) => !v.isDraft).length})</span>
              </button>
              <button
                onClick={() => setVideoStatusFilter("draft")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  videoStatusFilter === "draft"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "bg-[var(--surface-hover)] text-amber-400 border border-amber-500/30 hover:bg-amber-500/10"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Rascunhos ({videos.filter((v) => v.isDraft).length})</span>
              </button>
            </div>

            <div className="text-xs text-[var(--text-muted)] font-mono">
              Mostrando {filteredVideos.length} de {videos.length}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={filteredVideos.length > 0 && selectedVideoIds.size === filteredVideos.length}
                        onChange={toggleSelectAllVideos}
                        className="rounded border-[var(--border)] cursor-pointer"
                        title="Selecionar todos"
                      />
                    </th>
                    <th className="p-4">Vídeo / Highlight</th>
                    <th className="p-4">Duração</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Controles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingVideos ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando vídeos da competição...
                      </td>
                    </tr>
                  ) : filteredVideos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhum vídeo cadastrado para esta competição com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredVideos.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedVideoIds.has(item.id)}
                            onChange={() => toggleSelectVideo(item.id)}
                            className="rounded border-[var(--border)] cursor-pointer"
                          />
                        </td>
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
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleVideoStatus(item)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 transition-all ${
                              item.isDraft
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                            title="Clique para alternar Publicado / Rascunho"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isDraft ? "bg-amber-400" : "bg-emerald-400"}`} />
                            <span>{item.isDraft ? "Rascunho" : "Publicado"}</span>
                          </button>
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

              {/* Botão de Novo Atleta */}
              <button
                onClick={handleOpenCreatePlayerModal}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Plus size={16} />
                <span>NOVO ATLETA</span>
              </button>
            </div>
          </div>

          {/* Filtros de Clubes e Fotos */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Clube Prominente */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-bold uppercase shrink-0">Filtrar Clube:</span>
                <select
                  value={selectedTeamFilter}
                  onChange={(e) => setSelectedTeamFilter(e.target.value)}
                  className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer min-w-[240px]"
                >
                  <option value="all">Todos os Clubes ({players.length} atletas)</option>
                  {availableClubs.map((club) => {
                    const count = players.filter((p) => p.teamName === club.name || p.teamExternalId === club.externalId).length;
                    return (
                      <option key={club.name} value={club.name}>
                        {club.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPlayerModal(player)}
                                className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-lg text-xs font-bold transition-all"
                                title="Editar Atleta (Nome, Número, Posição, Idade, Foto)"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player)}
                                className="p-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold transition-all"
                                title="Excluir Atleta do Plantel"
                              >
                                <Trash2 size={14} />
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
                    <label className="admin-label">Status de Publicação *</label>
                    <select
                      value={videoFormData.status}
                      onChange={(e) => setVideoFormData({ ...videoFormData, status: e.target.value as any })}
                      className="admin-input cursor-pointer font-bold"
                    >
                      <option value="published">🟢 Publicado (Visível no App)</option>
                      <option value="draft">🟡 Rascunho (Oculto no App)</option>
                    </select>
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
                      placeholder="Ex: ge.globo / FAF"
                      className="admin-input"
                      value={newsFormData.source}
                      onChange={(e) => setNewsFormData({ ...newsFormData, source: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Status de Publicação *</label>
                    <select
                      value={newsFormData.status}
                      onChange={(e) => setNewsFormData({ ...newsFormData, status: e.target.value as any })}
                      className="admin-input cursor-pointer font-bold"
                    >
                      <option value="published">🟢 Publicado (Visível no App)</option>
                      <option value="draft">🟡 Rascunho (Oculto no App)</option>
                    </select>
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

      {/* --- MODAL COMPLETO DE CADASTRAR / EDITAR JOGADOR --- */}
      {isPlayerCrudModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200 max-w-lg">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users size={18} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {isEditingPlayerMode ? "Editar Atleta do Plantel" : `Novo Atleta — ${leagueName}`}
                </h3>
              </div>
              <button
                onClick={() => setIsPlayerCrudModalOpen(false)}
                className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                <div>
                  <label className="admin-label">Nome Completo do Atleta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aleilson"
                    className="admin-input"
                    value={playerFormData.name}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Clube / Equipe *</label>
                  <select
                    required
                    className="admin-input cursor-pointer font-bold"
                    value={playerFormData.teamExternalId}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, teamExternalId: Number(e.target.value) })}
                  >
                    {availableClubs.map((club) => (
                      <option key={club.externalId} value={club.externalId}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="admin-label">Posição *</label>
                    <select
                      className="admin-input cursor-pointer"
                      value={playerFormData.position}
                      onChange={(e) => setPlayerFormData({ ...playerFormData, position: e.target.value })}
                    >
                      <option value="Goalkeeper">Goleiro</option>
                      <option value="Defender">Zagueiro / Lateral</option>
                      <option value="Midfielder">Meio-Campo</option>
                      <option value="Attacker">Atacante</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Número</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      placeholder="Ex: 9"
                      className="admin-input font-mono"
                      value={playerFormData.number}
                      onChange={(e) => setPlayerFormData({ ...playerFormData, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Idade (anos)</label>
                    <input
                      type="number"
                      min={15}
                      max={50}
                      placeholder="Ex: 28"
                      className="admin-input font-mono"
                      value={playerFormData.age}
                      onChange={(e) => setPlayerFormData({ ...playerFormData, age: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-label">URL da Foto do Atleta</label>
                  <input
                    type="url"
                    placeholder="https://... (Foto oficial ou link direto)"
                    className="admin-input font-mono text-xs"
                    value={playerFormData.photo}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, photo: e.target.value })}
                  />
                </div>

                {playerFormData.photo.trim() && (
                  <div className="p-3.5 rounded-xl bg-black/30 border border-[var(--border)] flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-blue-500/40 shrink-0 bg-black/50">
                      <img
                        src={playerFormData.photo.trim()}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      <p className="font-bold text-white">Prévia da Foto Oficial</p>
                      <p className="text-[11px]">A foto será exibida imediatamente no card e escalações.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsPlayerCrudModalOpen(false)}
                  className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submittingPlayer}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingPlayer && <Loader2 size={14} className="animate-spin" />}
                  <span>{submittingPlayer ? "SALVANDO..." : isEditingPlayerMode ? "SALVAR ALTERAÇÕES" : "CADASTRAR ATLETA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
