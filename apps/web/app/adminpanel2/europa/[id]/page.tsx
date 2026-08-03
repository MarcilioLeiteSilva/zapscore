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

export default function Admin2CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Modais
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
        alert('Erro ao salvar notícia na API.');
      }
    } catch (err) {
      alert('Erro de conexão.');
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
      alert('Erro de conexão.');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontFamily: 'var(--font-outfit)' }}>
      {/* Header Gradiente Estilo /competitions */}
      <div 
        className="card glass" 
        style={{ 
          padding: '2.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem', 
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255, 31, 31, 0.05) 100%)',
          borderRadius: '24px'
        }}
      >
        <div 
          style={{ 
            width: '90px', 
            height: '90px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '3rem', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            border: '1px solid var(--glass-border)'
          }}
        >
          {leagueInfo.logo ? (
            <img src={leagueInfo.logo} alt="" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          ) : (
            '🏆'
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Link href="/adminpanel2/europa" className="badge badge-ft" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--success)', fontWeight: '800' }}>
              ← MÓDULO EUROPA
            </Link>
            <span className="badge badge-live">ID: {leagueIdStr}</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '900', color: 'white' }}>
            {leagueInfo.name}
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--success)' }}>● SISTEMA CONECTADO</span>
            <span>•</span>
            <span>{news.length} NOTÍCIAS | {videos.length} VÍDEOS | {scorers.length} ARTILHEIROS</span>
          </div>
        </div>
      </div>

      {/* Navegação por Abas em Pílula Glass Estilo /competitions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div 
          style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            background: 'var(--glass)', 
            padding: '0.5rem', 
            borderRadius: '16px', 
            width: 'fit-content',
            border: '1px solid var(--glass-border)'
          }}
        >
          <button
            onClick={() => setActiveTab('noticias')}
            style={{ 
              padding: '0.8rem 1.8rem', 
              borderRadius: '12px', 
              fontWeight: '800',
              fontSize: '0.85rem',
              letterSpacing: '0.5px',
              background: activeTab === 'noticias' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'noticias' ? 'black' : 'var(--text-muted)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'noticias' ? '0 4px 15px var(--primary-glow)' : 'none'
            }}
          >
            NOTÍCIAS ({news.length})
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            style={{ 
              padding: '0.8rem 1.8rem', 
              borderRadius: '12px', 
              fontWeight: '800',
              fontSize: '0.85rem',
              letterSpacing: '0.5px',
              background: activeTab === 'videos' ? '#dc2626' : 'transparent',
              color: activeTab === 'videos' ? 'white' : 'var(--text-muted)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'videos' ? '0 4px 15px rgba(220, 38, 38, 0.4)' : 'none'
            }}
          >
            VÍDEOS ({videos.length})
          </button>

          <button
            onClick={() => setActiveTab('artilharia')}
            style={{ 
              padding: '0.8rem 1.8rem', 
              borderRadius: '12px', 
              fontWeight: '800',
              fontSize: '0.85rem',
              letterSpacing: '0.5px',
              background: activeTab === 'artilharia' ? '#f59e0b' : 'transparent',
              color: activeTab === 'artilharia' ? 'black' : 'var(--text-muted)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'artilharia' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            ARTILHARIA ({scorers.length})
          </button>
        </div>

        {/* Input de Pesquisa */}
        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10 pr-4 text-xs"
          />
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="fade-in">
        {/* --- NOTÍCIAS --- */}
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

            <div className="table-wrapper glass">
              <table>
                <thead>
                  <tr>
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
                        Carregando notícias...
                      </td>
                    </tr>
                  ) : filteredNews.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhuma notícia cadastrada.
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
        )}

        {/* --- VÍDEOS COM GRID FLUIDO minmax(380px) --- */}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
              {loadingVideos ? (
                <div className="col-span-full p-12 text-center text-[var(--text-muted)]">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Carregando vídeos...
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="col-span-full p-12 text-center text-[var(--text-muted)] card">
                  Nenhum vídeo cadastrado.
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

        {/* --- ARTILHARIA --- */}
        {activeTab === 'artilharia' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="text-amber-400" size={20} />
                <span>Artilharia — Temporada 2026</span>
              </h2>
            </div>

            <div className="table-wrapper glass">
              <table>
                <thead>
                  <tr>
                    <th className="p-4 w-12 text-center">POS</th>
                    <th className="p-4">CLUBE / JOGADOR</th>
                    <th className="p-4 text-center">GOLS</th>
                    <th className="p-4 text-center">ASSISTÊNCIAS</th>
                    <th className="p-4 text-center">PÊNALTIS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {loadingScorers ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Carregando artilharia...
                      </td>
                    </tr>
                  ) : filteredScorers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        Nenhum artilheiro registrado.
                      </td>
                    </tr>
                  ) : (
                    filteredScorers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-4 text-center font-black font-mono text-[var(--text-muted)]">
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
                            <div>
                              <p className="font-bold text-white text-sm">{item.player.name}</p>
                              <p className="text-[var(--text-muted)] text-xs">{item.team.name}</p>
                            </div>
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
        )}
      </div>

      {/* --- MODAL DE INSERIR / EDITAR VÍDEO --- */}
      {isVideoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <Video className="text-red-500" size={20} />
                <h3 className="text-base font-bold text-white">
                  {currentVideoId ? 'Editar Vídeo' : `Novo Vídeo — ${leagueInfo.name}`}
                </h3>
              </div>
              <button onClick={() => setIsVideoModalOpen(false)} className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white">
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
                    placeholder="Ex: Melhores Momentos"
                    className="admin-input"
                    value={videoFormData.title}
                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Duração</label>
                    <input
                      type="text"
                      placeholder="04:30"
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
                  <label className="admin-label">Thumbnail URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={videoFormData.thumbnailUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, thumbnailUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Vídeo URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://youtube.com/..."
                    className="admin-input font-mono"
                    value={videoFormData.videoUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, videoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsVideoModalOpen(false)} className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white">
                  CANCELAR
                </button>
                <button type="submit" disabled={submittingVideo} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 disabled:opacity-50">
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
                <Newspaper className="text-[var(--primary)]" size={20} />
                <h3 className="text-base font-bold text-white">
                  {currentNewsId ? 'Editar Notícia' : `Nova Notícia — ${leagueInfo.name}`}
                </h3>
              </div>
              <button onClick={() => setIsNewsModalOpen(false)} className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white">
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
                    placeholder="Ex: Título da notícia"
                    className="admin-input"
                    value={newsFormData.title}
                    onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Resumo / Descrição</label>
                  <input
                    type="text"
                    placeholder="Resumo..."
                    className="admin-input"
                    value={newsFormData.description}
                    onChange={(e) => setNewsFormData({ ...newsFormData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Fonte</label>
                    <input
                      type="text"
                      placeholder="Fonte..."
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
                  <label className="admin-label">Imagem URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="admin-input font-mono"
                    value={newsFormData.imageUrl}
                    onChange={(e) => setNewsFormData({ ...newsFormData, imageUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Link Externo</label>
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
                <button type="button" onClick={() => setIsNewsModalOpen(false)} className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white">
                  CANCELAR
                </button>
                <button type="submit" disabled={submittingNews} className="bg-[var(--primary)] text-black px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50">
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
