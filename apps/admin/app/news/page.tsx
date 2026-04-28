"use client";

import React, { useState, useEffect } from "react";
import { Newspaper, Plus, Search, Trash2, Edit2, Eye, X, Loader2, Globe } from "lucide-react";
import Link from "next/link";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ title: "", source: "ZapScore", imageUrl: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/news`);
      const data = await res.json();
      setNews(data);
    } catch (e) {
      console.error("Erro ao carregar notícias:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = currentId ? `${API_URL}/news/${currentId}` : `${API_URL}/news`;
      const method = currentId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Sucesso!");
        setIsModalOpen(false);
        fetchNews();
      }
    } catch (e) {
      alert("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deletar notícia?")) return;
    try {
      await fetch(`${API_URL}/news/${id}`, { method: "DELETE" });
      fetchNews();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({ title: item.title, source: item.source, imageUrl: item.imageUrl, description: item.description });
    } else {
      setCurrentId(null);
      setFormData({ title: "", source: "ZapScore", imageUrl: "", description: "" });
    }
    setIsModalOpen(true);
  };

  return (
    <div class="p-8 space-y-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-4xl font-black text-white uppercase tracking-tight">Portal de Notícias</h2>
          <p class="text-slate-400 mt-2 font-medium">Gerencie o conteúdo informativo direto na Produção.</p>
        </div>
        <div class="flex space-x-4">
          <Link 
            href="/news/sources"
            class="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform hover:-translate-y-1 flex items-center space-x-2 border border-slate-700"
          >
            <Globe size={20} className="text-orange-500" />
            <span>GERENCIAR FONTES</span>
          </Link>
          <button 
            onClick={() => openModal()}
            class="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>NOVA NOTÍCIA</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div class="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 text-white">
           <span class="text-xs font-bold text-orange-500 uppercase tracking-widest">
            {loading ? "Carregando..." : `${news.length} Notícias encontradas`}
           </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-800/30 text-slate-300 text-[11px] font-black uppercase tracking-widest">
                <th class="p-6">Informação / Título</th>
                <th class="p-6">Fonte</th>
                <th class="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              {loading ? (
                <tr><td colspan="3" class="p-12 text-center text-slate-500"><Loader2 class="animate-spin mx-auto mb-2" /> Carregando...</td></tr>
              ) : news.map((item) => (
                <tr key={item.id} class="hover:bg-slate-800/40 transition-all">
                  <td class="p-6">
                    <div class="flex items-center space-x-5">
                      <div class="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 text-white">
                        {item.imageUrl ? <img src={item.imageUrl} class="w-full h-full object-cover" /> : <Newspaper class="m-5" />}
                      </div>
                      <div>
                        <p class="font-bold text-white text-lg leading-tight line-clamp-1">{item.title}</p>
                        <p class="text-xs text-slate-500 font-bold mt-1 uppercase">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td class="p-6">
                    <span class="px-3 py-1 bg-slate-800 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">{item.source || 'ZAPSCORE'}</span>
                  </td>
                  <td class="p-6 text-right">
                    <div class="flex justify-end space-x-2">
                      <button onClick={() => window.open(item.imageUrl, '_blank')} class="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all"><Eye size={18} /></button>
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
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <div class="p-8 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 class="text-2xl font-black uppercase italic tracking-tight">{currentId ? "Editar Notícia" : "Nova Notícia"}</h3>
              <button onClick={() => setIsModalOpen(false)} class="p-2 hover:bg-slate-800 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSubmit} class="p-8 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="text-xs font-bold text-slate-500 uppercase">Título</label>
                  <input 
                    type="text" required
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase">Fonte</label>
                  <input 
                    type="text"
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.source}
                    onChange={e => setFormData({...formData, source: e.target.value})}
                  />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase">URL Imagem</label>
                  <input 
                    type="text"
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  />
                </div>
                <div class="col-span-2">
                  <label class="text-xs font-bold text-slate-500 uppercase">Conteúdo</label>
                  <textarea 
                    rows="4" required
                    class="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} class="px-6 py-2 text-slate-400 font-bold hover:text-white">CANCELAR</button>
                <button type="submit" disabled={submitting} class="bg-orange-600 px-10 py-4 rounded-2xl font-black text-white hover:scale-105 transition-all shadow-xl disabled:opacity-50">
                  {submitting ? "SALVANDO..." : "SALVAR NOTÍCIA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
