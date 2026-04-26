"use client";

import React, { useState, useEffect } from "react";
import { Video, Plus, Trash2, Edit2, Play, X, Loader2, ExternalLink } from "lucide-react";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function VideosPage() {
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
      console.error("Erro ao carregar vídeos:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
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
        alert("Sucesso!");
        setIsModalOpen(false);
        fetchVideos();
      }
    } catch (e) {
      alert("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deletar vídeo?")) return;
    try {
      await fetch(`${API_URL}/videos/${id}`, { method: "DELETE" });
      fetchVideos();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  const openModal = (item = null) => {
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
    <div class="p-8 space-y-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-4xl font-black text-white uppercase tracking-tight">Vídeos & Watch</h2>
          <p class="text-slate-400 mt-2 font-medium">Gerencie os highlights diretamente na Produção.</p>
        </div>
        <button 
          onClick={() => openModal()}
          class="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform hover:-translate-y-1 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>CADASTRAR VÍDEO</span>
        </button>
      </div>

      {/* List */}
      <div class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 text-white">
           <span class="text-xs font-bold text-red-500 uppercase tracking-widest">
            {loading ? "Carregando..." : `${videos.length} Vídeos encontrados`}
           </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-800/30 text-slate-300 text-[11px] font-black uppercase tracking-widest">
                <th class="p-6">Vídeo / Highlight</th>
                <th class="p-6">Duração</th>
                <th class="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              {loading ? (
                <tr><td colspan="3" class="p-12 text-center text-slate-500"><Loader2 class="animate-spin mx-auto mb-2" /> Carregando...</td></tr>
              ) : videos.map((item) => (
                <tr key={item.id} class="hover:bg-slate-800/40 transition-all">
                  <td class="p-6">
                    <div class="flex items-center space-x-5 text-white">
                      <div class="w-24 h-14 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 relative">
                        {item.thumbnailUrl ? <img src={item.thumbnailUrl} class="w-full h-full object-cover" /> : <Video class="m-4" />}
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play size={16} class="fill-current" />
                        </div>
                      </div>
                      <p class="font-bold text-white text-lg leading-tight line-clamp-1">{item.title}</p>
                    </div>
                  </td>
                  <td class="p-6">
                    <span class="text-slate-400 font-mono text-sm">{item.duration || '00:00'}</span>
                  </td>
                  <td class="p-6 text-right">
                    <div class="flex justify-end space-x-2">
                      <button onClick={() => window.open(item.videoUrl, '_blank')} class="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all"><ExternalLink size={18} /></button>
                      <button onClick={() => openModal(item)} class="p-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} class="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
          <div class="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <div class="p-8 border-b border-slate-800 flex justify-between items-center">
              <h3 class="text-2xl font-black uppercase italic tracking-tight">{currentId ? "Editar Vídeo" : "Novo Vídeo"}</h3>
              <button onClick={() => setIsModalOpen(false)} class="p-2 hover:bg-slate-800 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSubmit} class="p-8 space-y-6">
              <div class="grid grid-cols-2 gap-4 text-white">
                <div class="col-span-2">
                  <label class="text-xs font-bold text-slate-500 uppercase">Título</label>
                  <input 
                    type="text" required
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase">Duração (00:00)</label>
                  <input 
                    type="text"
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase">Thumbnail URL</label>
                  <input 
                    type="text"
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.thumbnailUrl}
                    onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                  />
                </div>
                <div class="col-span-2">
                  <label class="text-xs font-bold text-slate-500 uppercase">URL do Vídeo (YouTube/MP4)</label>
                  <input 
                    type="text" required
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.videoUrl}
                    onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                  />
                </div>
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} class="px-6 py-2 text-slate-400 font-bold hover:text-white">CANCELAR</button>
                <button type="submit" disabled={submitting} class="bg-red-600 px-10 py-4 rounded-2xl font-black text-white hover:scale-105 transition-all shadow-xl disabled:opacity-50">
                  {submitting ? "SALVANDO..." : "SALVAR VÍDEO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
