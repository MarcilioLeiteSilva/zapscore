'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Newspaper, 
  Video, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Search,
  Loader2,
  X,
  Play
} from 'lucide-react';
import { EUROPEAN_LEAGUES } from '../../registry';

const API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

export default function Admin3CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leagueIdStr = resolvedParams.id;
  const leagueIdNum = parseInt(leagueIdStr, 10);

  const leagueInfo = EUROPEAN_LEAGUES.find((l) => l.id === leagueIdNum) || {
    id: leagueIdNum,
    name: `Liga ${leagueIdStr}`,
    country: 'Europa',
    logo: '',
  };

  const [dbLeagueUuid, setDbLeagueUuid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'noticias' | 'videos' | 'artilharia'>('noticias');
  const [news, setNews] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingScorers, setLoadingScorers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados dos Modais
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentNewsId, setCurrentNewsId] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [submittingNews, setSubmittingNews] = useState(false);
  const [submittingVideo, setSubmittingVideo] = useState(false);

  const [newsFormData, setNewsFormData] = useState({
    title: '',
    description: '',
    source: '',
    imageUrl: '',
    url: '',
  });

  const [videoFormData, setVideoFormData] = useState({
    title: '',
    duration: '',
    thumbnailUrl: '',
    videoUrl: '',
  });

  // 1. Resolver UUID da liga e buscar Notícias/Vídeos
  useEffect(() => {
    async function resolveLeagueUuidAndFetch() {
      try {
        const res = await fetch(`${API_URL}/competitions/stored`);
        if (res.ok) {
          const leagues = await res.json();
          const match = leagues.find((l: any) => l.externalId === leagueIdNum || l.id === leagueIdStr);
          if (match && match.id) {
            setDbLeagueUuid(match.id);
            fetchNews(match.id);
            fetchVideos(match.id);
          } else {
            fetchNews(leagueIdStr);
            fetchVideos(leagueIdStr);
          }
        } else {
          fetchNews(leagueIdStr);
          fetchVideos(leagueIdStr);
        }
      } catch (err) {
        console.error('Erro ao resolver UUID da liga:', err);
        fetchNews(leagueIdStr);
        fetchVideos(leagueIdStr);
      }
    }

    resolveLeagueUuidAndFetch();
    fetchScorers();
  }, [leagueIdStr, leagueIdNum]);

  const fetchNews = async (targetLeagueId?: string) => {
    setLoadingNews(true);
    const idToUse = targetLeagueId || dbLeagueUuid || leagueIdStr;
    try {
      const res = await fetch(`${API_URL}/news?limit=100&leagueId=${idToUse}`);
      if (res.ok) {
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar notícias:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchVideos = async (targetLeagueId?: string) => {
    setLoadingVideos(true);
    const idToUse = targetLeagueId || dbLeagueUuid || leagueIdStr;
    try {
      const res = await fetch(`${API_URL}/videos?limit=100&leagueId=${idToUse}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar vídeos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchScorers = async () => {
    setLoadingScorers(true);
    try {
      const res = await fetch(`${API_URL}/standings/topscorers?leagueId=${leagueIdNum}&season=2026`);
      if (res.ok) {
        const data = await res.json();
        setScorers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar artilharia:', err);
    } finally {
      setLoadingScorers(false);
    }
  };

  // Handlers para Notícias
  const handleOpenNewsModal = (newsItem?: any) => {
    if (newsItem) {
      setCurrentNewsId(newsItem.id);
      setNewsFormData({
        title: newsItem.title || '',
        description: newsItem.description || '',
        source: newsItem.source || '',
        imageUrl: newsItem.imageUrl || '',
        url: newsItem.externalUrl || newsItem.url || '',
      });
    } else {
      setCurrentNewsId(null);
      setNewsFormData({ title: '', description: '', source: '', imageUrl: '', url: '' });
    }
    setIsNewsModalOpen(true);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNews(true);

    const payload = {
      title: newsFormData.title,
      description: newsFormData.description || newsFormData.title,
      source: newsFormData.source || 'ZapScore Admin',
      imageUrl: newsFormData.imageUrl || null,
      externalUrl: newsFormData.url || null,
      leagueId: dbLeagueUuid || leagueIdStr,
    };

    try {
      const url = currentNewsId ? `${API_URL}/news/${currentNewsId}` : `${API_URL}/news`;
      const method = currentNewsId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsNewsModalOpen(false);
        fetchNews();
      } else {
        alert('Erro ao salvar notícia na API. Verifique os campos.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar notícia.');
    } finally {
      setSubmittingNews(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Deseja realmente remover esta notícia?')) return;
    try {
      const res = await fetch(`${API_URL}/news/${id}`, { method: 'DELETE' });
      if (res.ok) fetchNews();
    } catch (err) {
      alert('Erro ao deletar notícia.');
    }
  };

  // Handlers para Vídeos
  const handleOpenVideoModal = (videoItem?: any) => {
    if (videoItem) {
      setCurrentVideoId(videoItem.id);
      setVideoFormData({
        title: videoItem.title || '',
        duration: videoItem.duration || '',
        thumbnailUrl: videoItem.thumbnailUrl || '',
        videoUrl: videoItem.videoUrl || '',
      });
    } else {
      setCurrentVideoId(null);
      setVideoFormData({ title: '', duration: '', thumbnailUrl: '', videoUrl: '' });
    }
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVideo(true);

    const payload = {
      title: videoFormData.title,
      duration: videoFormData.duration || '00:00',
      thumbnailUrl: videoFormData.thumbnailUrl || null,
      videoUrl: videoFormData.videoUrl,
      leagueId: dbLeagueUuid || leagueIdStr,
    };

    try {
      const url = currentVideoId ? `${API_URL}/videos/${currentVideoId}` : `${API_URL}/videos`;
      const method = currentVideoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsVideoModalOpen(false);
        fetchVideos();
      } else {
        alert('Erro ao salvar vídeo na API.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar vídeo.');
    } finally {
      setSubmittingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Deseja realmente remover este vídeo?')) return;
    try {
      const res = await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVideos();
    } catch (err) {
      alert('Erro ao deletar vídeo.');
    }
  };

  // Filtros de busca
  const filteredNews = news.filter((n) =>
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter((v) =>
    v.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScorers = scorers.filter((s) =>
    s.player?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.team?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      {/* Header da Liga */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <Link
            href="/adminpanel3/europa"
            className="p-3 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] p-2.5 flex items-center justify-center shrink-0">
            {leagueInfo.logo ? (
              <img src={leagueInfo.logo} alt={leagueInfo.name} className="w-full h-full object-contain" />
            ) : (
              <Trophy className="text-[var(--primary)]" size={24} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white">{leagueInfo.name}</h1>
              <span className="badge badge-live text-[10px]">ID: {leagueIdStr}</span>
            </div>
            <p className="text-[var(--text-muted)] text-xs font-semibold mt-1">
              {leagueInfo.country} — Gestão de Conteúdo e Estatísticas (Admin 3.0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Notícias</p>
            <p className="text-lg font-black text-white font-mono">{news.length}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Vídeos</p>
            <p className="text-lg font-black text-red-400 font-mono">{videos.length}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Artilheiros</p>
            <p className="text-lg font-black text-amber-400 font-mono">{scorers.length}</p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas + Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('noticias')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'noticias'
                ? 'bg-[var(--primary)] text-black shadow-lg'
                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]'
            }`}
          >
            <Newspaper size={18} />
            <span>Notícias</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {news.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]'
            }`}
          >
            <Video size={18} />
            <span>Vídeos & Highlights</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {videos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('artilharia')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'artilharia'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]'
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
            className="admin-input pl-10 pr-4 text-xs"
          />
        </div>
      </div>

      {/* --- ABA NOTÍCIAS --- */}
      {activeTab === 'noticias' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Newspaper className="text-[var(--primary)]" size={20} />
              <span>Notícias Registradas ({filteredNews.length})</span>
            </h2>
            <button
              onClick={() => handleOpenNewsModal()}
              className="bg-[var(--primary)] text-black px-4 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus size={16} />
              <span>NOVA NOTÍCIA</span>
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4">Matéria</th>
                    <th className="p-4">Fonte</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingNews ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando notícias da liga...
                      </td>
                    </tr>
                  ) : filteredNews.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhuma notícia cadastrada para esta competição.
                      </td>
                    </tr>
                  ) : (
                    filteredNews.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4 pr-6">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--border)]" />
                            )}
                            <div>
                              <p className="font-bold text-white text-sm line-clamp-1">{item.title}</p>
                              {item.description && (
                                <p className="text-[var(--text-muted)] text-xs line-clamp-1 mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="badge badge-ft text-[10px]">{item.source || 'ZapScore'}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-[var(--text-muted)] font-mono text-[11px]">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {item.externalUrl && (
                              <a href={item.externalUrl} target="_blank" rel="noreferrer" className="p-2 text-[var(--text-muted)] hover:text-white">
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button onClick={() => handleOpenNewsModal(item)} className="p-2 text-[var(--text-muted)] hover:text-white">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDeleteNews(item.id)} className="p-2 text-red-400 hover:text-red-300">
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

      {/* --- ABA VÍDEOS & HIGHLIGHTS --- */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="text-red-500" size={20} />
              <span>Vídeos Registrados ({filteredVideos.length})</span>
            </h2>
            <button
              onClick={() => handleOpenVideoModal()}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
            >
              <Plus size={16} />
              <span>NOVO VÍDEO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingVideos ? (
              <div className="col-span-full p-12 text-center text-[var(--text-muted)]">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando vídeos da liga...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="col-span-full p-12 text-center text-[var(--text-muted)] card">
                Nenhum vídeo cadastrado para esta competição.
              </div>
            ) : (
              filteredVideos.map((vid) => (
                <div key={vid.id} className="card p-4 space-y-3 group hover:border-red-500/50 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-[var(--border)]">
                      {vid.thumbnailUrl ? (
                        <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--surface-hover)]">
                          <Play size={32} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                        {vid.duration || '00:00'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm line-clamp-2">{vid.title}</h3>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <a href={vid.videoUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-red-400 flex items-center gap-1 hover:underline">
                      <Play size={14} />
                      <span>Assistir</span>
                    </a>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenVideoModal(vid)} className="p-1.5 text-[var(--text-muted)] hover:text-white">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDeleteVideo(vid.id)} className="p-1.5 text-red-400 hover:text-red-300">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- ABA ARTILHARIA --- */}
      {activeTab === 'artilharia' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="text-amber-400" size={20} />
              <span>Artilharia — Temporada 2026</span>
            </h2>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Jogador</th>
                    <th className="p-4">Clube</th>
                    <th className="p-4 text-center">Gols</th>
                    <th className="p-4 text-center">Assistências</th>
                    <th className="p-4 text-center">Pênaltis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingScorers ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando artilharia da liga...
                      </td>
                    </tr>
                  ) : filteredScorers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhum artilheiro registrado para esta temporada.
                      </td>
                    </tr>
                  ) : (
                    filteredScorers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4 text-center font-bold font-mono text-[var(--text-muted)]">
                          {idx + 1}
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.player.photo ? (
                                <img src={item.player.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-xs text-[var(--text-muted)]">
                                  {item.player.name?.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-white text-sm">{item.player.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {item.team.logo && (
                              <img src={item.team.logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <span className="text-[var(--text-muted)] font-medium">{item.team.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-black text-amber-400 text-sm font-mono">
                          {item.goals}
                        </td>
                        <td className="p-4 text-center font-bold text-white font-mono">
                          {item.assists ?? 0}
                        </td>
                        <td className="p-4 text-center text-[var(--text-muted)] font-mono">
                          {item.penalties ?? 0}
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
                  {currentVideoId ? 'Editar Vídeo' : `Novo Vídeo — ${leagueInfo.name}`}
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
                      value={`${leagueInfo.name} (ID: ${leagueIdStr})`}
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
                  {submittingVideo ? 'SALVANDO...' : 'SALVAR VÍDEO'}
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
                  {currentNewsId ? 'Editar Notícia' : `Nova Notícia — ${leagueInfo.name}`}
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
                      value={`${leagueInfo.name} (ID: ${leagueIdStr})`}
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
                  {submittingNews ? 'SALVANDO...' : 'SALVAR NOTÍCIA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
