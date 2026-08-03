'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, ArrowLeft, Loader2, Play, Edit3, Trash2, Plus, X } from 'lucide-react';

const API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

export default function Admin3VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    thumbnailUrl: '',
    videoUrl: '',
  });

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/videos?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar vídeos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({
        title: item.title || '',
        duration: item.duration || '',
        thumbnailUrl: item.thumbnailUrl || '',
        videoUrl: item.videoUrl || '',
      });
    } else {
      setCurrentId(null);
      setFormData({ title: '', duration: '', thumbnailUrl: '', videoUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: formData.title,
      duration: formData.duration || '00:00',
      thumbnailUrl: formData.thumbnailUrl || null,
      videoUrl: formData.videoUrl,
    };

    try {
      const url = currentId ? `${API_URL}/videos/${currentId}` : `${API_URL}/videos`;
      const method = currentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchVideos();
      } else {
        alert('Erro ao salvar vídeo na API.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este vídeo?')) return;
    try {
      const res = await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVideos();
    } catch (err) {
      alert('Erro ao deletar vídeo.');
    }
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-outfit)' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/adminpanel3"
              className="p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            <Video className="text-red-500" size={32} />
            <span>Gestão Geral de Vídeos & Watch</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Gerenciar highlights, melhores momentos e transmissões de vídeo.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 shrink-0"
        >
          <Plus size={18} />
          <span>NOVO VÍDEO</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-[var(--text-muted)]">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            Carregando vídeos...
          </div>
        ) : videos.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[var(--text-muted)] card">
            Nenhum vídeo cadastrado.
          </div>
        ) : (
          videos.map((vid) => (
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
                  <button onClick={() => handleOpenModal(vid)} className="p-1.5 text-[var(--text-muted)] hover:text-white">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(vid.id)} className="p-1.5 text-red-400 hover:text-red-300">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <Video className="text-red-500" size={20} />
                <h3 className="text-base font-bold text-white">
                  {currentId ? 'Editar Vídeo' : 'Novo Vídeo'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                <div>
                  <label className="admin-label">Título do Vídeo *</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Duração (Ex: 04:30)</label>
                  <input
                    type="text"
                    className="admin-input font-mono"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">URL da Thumbnail</label>
                  <input
                    type="text"
                    className="admin-input font-mono"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">URL do Vídeo (YouTube/MP4) *</label>
                  <input
                    type="text"
                    required
                    className="admin-input font-mono"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white">
                  CANCELAR
                </button>
                <button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 disabled:opacity-50">
                  {submitting ? 'SALVANDO...' : 'SALVAR VÍDEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
