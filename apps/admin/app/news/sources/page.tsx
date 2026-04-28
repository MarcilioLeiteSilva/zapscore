"use client";

import React, { useState, useEffect } from "react";
import { Globe, Plus, Trash2, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", url: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/news-sources`);
      const data = await res.json();
      setSources(data);
    } catch (e) {
      console.error("Erro ao carregar fontes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/news-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", url: "" });
        fetchSources();
      } else {
        alert("Erro ao salvar fonte. Verifique a URL.");
      }
    } catch (e) {
      alert("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_URL}/news-sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      });
      fetchSources();
    } catch (e) {
      alert("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar esta fonte permanentemente?")) return;
    try {
      await fetch(`${API_URL}/news-sources/${id}`, { method: "DELETE" });
      fetchSources();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/news" className="p-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tight">Fontes de Notícias</h2>
            <p className="text-slate-400 mt-1 font-medium">Gerencie os feeds RSS que alimentam o ZapScore.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="col-span-1">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-white uppercase italic">Adicionar Fonte</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Portal</label>
                <input 
                  type="text" required placeholder="Ex: GE, UOL, ESPN"
                  className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">URL do Feed RSS</label>
                <input 
                  type="url" required placeholder="https://portal.com/rss"
                  className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-xl font-black shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                <span>CADASTRAR FONTE</span>
              </button>
            </form>
          </div>
        </div>

        {/* Lista */}
        <div className="col-span-2">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                {loading ? "Carregando..." : `${sources.length} Fontes Ativas`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/30 text-slate-300 text-[11px] font-black uppercase tracking-widest">
                    <th className="p-6">Portal / URL</th>
                    <th className="p-6 text-center">Status</th>
                    <th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={3} className="p-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" /></td></tr>
                  ) : sources.length === 0 ? (
                    <tr><td colSpan={3} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">Nenhuma fonte manual cadastrada.</td></tr>
                  ) : sources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-slate-800 rounded-xl text-orange-500">
                            <Globe size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">{source.name}</p>
                            <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{source.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <button onClick={() => toggleActive(source.id, source.active)}>
                          {source.active ? (
                            <CheckCircle className="text-green-500 mx-auto" size={24} />
                          ) : (
                            <XCircle className="text-red-500 mx-auto" size={24} />
                          )}
                        </button>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => handleDelete(source.id)}
                          className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
