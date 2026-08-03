'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Newspaper, ArrowLeft, Loader2, ExternalLink, Edit3, Trash2, Plus, X } from 'lucide-react';

const API_URL = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

export default function Admin3NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: '',
    imageUrl: '',
    url: '',
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/news?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({
        title: item.title || '',
        description: item.description || '',
        source: item.source || '',
        imageUrl: item.imageUrl || '',
        url: item.externalUrl || item.url || '',
      });
    } else {
      setCurrentId(null);
      setFormData({ title: '', description: '', source: '', imageUrl: '', url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: formData.title,
      description: formData.description || formData.title,
      source: formData.source || 'ZapScore Admin',
      imageUrl: formData.imageUrl || null,
      externalUrl: formData.url || null,
    };

    try {
      const url = currentId ? `${API_URL}/news/${currentId}` : `${API_URL}/news`;
      const method = currentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchNews();
      } else {
        alert('Erro ao salvar notícia na API.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta notícia?')) return;
    try {
      const res = await fetch(`${API_URL}/news/${id}`, { method: 'DELETE' });
      if (res.ok) fetchNews();
    } catch (err) {
      alert('Erro ao deletar notícia.');
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
            <Newspaper className="text-[var(--primary)]" size={32} />
            <span>Gestão Geral de Notícias</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Visualizar, criar e gerenciar notícias de todas as competições.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-[var(--primary)] text-black px-5 py-3 rounded-xl font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus size={18} />
          <span>CRIAR NOTÍCIA</span>
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[var(--text-muted)]">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Carregando notícias...
                  </td>
                </tr>
              ) : news.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[var(--text-muted)]">
                    Nenhuma notícia cadastrada.
                  </td>
                </tr>
              ) : (
                news.map((item) => (
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
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-[var(--text-muted)] hover:text-white">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:text-red-300">
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

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container animate-in fade-in zoom-in duration-200">
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <Newspaper className="text-[var(--primary)]" size={20} />
                <h3 className="text-base font-bold text-white">
                  {currentId ? 'Editar Notícia' : 'Nova Notícia'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="modal-body space-y-4">
                <div>
                  <label className="admin-label">Título da Notícia *</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Resumo / Descrição</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Fonte / Portal</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">URL da Imagem</label>
                  <input
                    type="text"
                    className="admin-input font-mono"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Link Externo</label>
                  <input
                    type="text"
                    className="admin-input font-mono"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs text-[var(--text-muted)] font-bold hover:text-white">
                  CANCELAR
                </button>
                <button type="submit" disabled={submitting} className="bg-[var(--primary)] text-black px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50">
                  {submitting ? 'SALVANDO...' : 'SALVAR NOTÍCIA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
