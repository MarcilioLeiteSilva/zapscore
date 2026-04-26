"use client";

import React, { useState, useEffect } from "react";
import { Video, Plus, Trash2, Edit2, Play, X, Loader2, ExternalLink } from "lucide-react";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ title: "", duration: "", videoUrl: "", thumbnailUrl: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/videos`);
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = currentId ? `${API_URL}/videos/${currentId}` : `${API_URL}/videos`;
      const method = currentId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchVideos();
        alert("Vídeo salvo com sucesso!");
      }
    } catch (e) {
      alert("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover vídeo permanentemente?")) return;
    await fetch(`${API_URL}/videos/${id}`, { method: "DELETE" });
    fetchVideos();
  };

  const openModal = (item: any = null) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({ title: item.title, duration: item.duration, videoUrl: item.videoUrl, thumbnailUrl: item.thumbnailUrl });
    } else {
      setCurrentId(null);
      setFormData({ title: "", duration: "", videoUrl: "", thumbnailUrl: "" });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tight italic">Gestão de Vídeos</h2>
          <p className="text-slate-400 mt-2 font-medium">Administre os destaques e vídeos da aba Watch.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform hover:-translate-y-1 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>CADASTRAR VÍDEO</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
           <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
             {loading ? "Sincronizando..." : `${videos.length} Vídeos em Destaque`}
           </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/30 text-slate-300 text-[11px] font-black uppercase tracking-widest">
                <th className="p-6">Vídeo / Highlight</th>
                <th className="p-6">Duração</th>
                <th className="p-6 text-right">Controle Administrativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-4" size={32} /> Carregando vídeos...</td></tr>
              ) : videos.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-all border-b border-slate-800/50">
                  <td className="p-6">
                    <div className="flex items-center space-x-5">
                      <div className="w-24 h-14 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 relative">
                        {item.thumbnailUrl ? <img src={item.thumbnailUrl} className="w-full h-full object-cover" /> : <Video className="m-4 text-slate-600" />}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play size={16} className="text-white fill-current" />
                        </div>
                      </div>
                      <p className="font-bold text-white text-lg leading-tight line-clamp-1">{item.title}</p>
                    </div>
                  </td>
                  <td className="p-6 text-slate-400 font-mono text-sm">{item.duration || '00:00'}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => window.open(item.videoUrl, '_blank')} className="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all" title="Ver Vídeo"><ExternalLink size={18} /></button>
                      <button onClick={() => openModal(item)} className="p-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all" title="Editar"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all" title="Deletar"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="text-2xl font-black uppercase italic tracking-tight">{currentId ? "Editar Vídeo" : "Cadastrar Novo Vídeo"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Título do Vídeo</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500 font-bold"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duração (ex: 04:30)</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thumbnail (URL)</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.thumbnailUrl}
                    onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL do Vídeo (YouTube ou MP4)</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.videoUrl}
                    onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 font-bold hover:text-white transition-colors">CANCELAR</button>
                <button type="submit" disabled={submitting} className="bg-red-600 px-10 py-4 rounded-2xl font-black text-white hover:scale-105 transition-all shadow-xl disabled:opacity-50">
                  {submitting ? "GRAVANDO..." : "SALVAR VÍDEO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
