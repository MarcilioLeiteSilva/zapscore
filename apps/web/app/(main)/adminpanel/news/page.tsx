"use client";

import React, { useState, useEffect } from "react";
import { Newspaper, Plus, Trash2, Edit2, Eye, X, Loader2 } from "lucide-react";
import Link from "next/link";

const API_URL = "https://zapscore-zapscore-api.gtalg3.easypanel.host";

export default function AdminNewsPage() {
  const [news, setNews] = useState([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ 
    title: "", 
    source: "ZapScore", 
    imageUrl: "", 
    description: "",
    leagueId: "",
    teamId: "" 
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNews();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [lRes, tRes] = await Promise.all([
        fetch(`${API_URL}/leagues`),
        fetch(`${API_URL}/teams`)
      ]);
      const lData = await lRes.json();
      const tData = await tRes.json();
      setLeagues(Array.isArray(lData) ? lData : []);
      setTeams(Array.isArray(tData) ? tData : []);
    } catch (e) {
      console.error("Erro ao carregar metadados:", e);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/news`);
      const data = await res.json();
      setNews(data);
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
      const url = currentId ? `${API_URL}/news/${currentId}` : `${API_URL}/news`;
      const method = currentId ? "PUT" : "POST";
      
      // Limpa IDs vazios para enviar null
      const payload = {
        ...formData,
        leagueId: formData.leagueId || null,
        teamId: formData.teamId || null
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchNews();
        alert("Sucesso!");
      }
    } catch (e) {
      alert("Erro ao conectar com a API");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão?")) return;
    await fetch(`${API_URL}/news/${id}`, { method: "DELETE" });
    fetchNews();
  };

  const openModal = (item: any = null) => {
    if (item) {
      setCurrentId(item.id);
      setFormData({ 
        title: item.title, 
        source: item.source, 
        imageUrl: item.imageUrl, 
        description: item.description,
        leagueId: item.leagueId || "",
        teamId: item.teamId || ""
      });
    } else {
      setCurrentId(null);
      setFormData({ title: "", source: "ZapScore", imageUrl: "", description: "", leagueId: "", teamId: "" });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tight italic">Gestão de Notícias</h2>
          <p className="text-slate-400 mt-2 font-medium">Controle o feed de notícias da plataforma em tempo real.</p>
        </div>
        <div className="flex space-x-4">
          <Link 
            href="/adminpanel/news/sources"
            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform hover:-translate-y-1 flex items-center space-x-2 border border-slate-700"
          >
            <Newspaper size={20} className="text-orange-500" />
            <span>GERENCIAR FONTES</span>
          </Link>
          <button 
            onClick={() => openModal()}
            className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>NOVA NOTÍCIA</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
           <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
             {loading ? "Sincronizando..." : `${news.length} Notícias Ativas`}
           </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/30 text-slate-300 text-[11px] font-black uppercase tracking-widest">
                <th className="p-6">Informação / Título</th>
                <th className="p-6">Classificação</th>
                <th className="p-6 text-right">Ações de Gerenciamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-4" size={32} /> Carregando base de dados...</td></tr>
              ) : news.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-all border-b border-slate-800/50">
                  <td className="p-6">
                    <div className="flex items-center space-x-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Newspaper className="m-5 text-slate-600" />}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg leading-tight line-clamp-1">{item.title}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">{item.source || 'ZAPSCORE'} • {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col space-y-1">
                      {item.league && <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-black w-fit uppercase">{item.league.name}</span>}
                      {item.team && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-black w-fit uppercase">{item.team.name}</span>}
                      {!item.league && !item.team && <span className="text-[10px] text-slate-600 font-bold uppercase italic">Sem classificação</span>}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => window.open(item.imageUrl, '_blank')} className="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all" title="Ver Imagem"><Eye size={18} /></button>
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
              <h3 className="text-2xl font-black uppercase italic tracking-tight">{currentId ? "Editar Notícia" : "Publicar Nova Notícia"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Título da Matéria</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                {/* Dropdowns de Classificação */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Competição (Liga)</label>
                  <select 
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold appearance-none cursor-pointer"
                    value={formData.leagueId}
                    onChange={e => setFormData({...formData, leagueId: e.target.value})}
                  >
                    <option value="">Nenhum</option>
                    {leagues.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.season})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Relacionado</label>
                  <select 
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold appearance-none cursor-pointer"
                    value={formData.teamId}
                    onChange={e => setFormData({...formData, teamId: e.target.value})}
                  >
                    <option value="">Nenhum</option>
                    {teams.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fonte</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.source}
                    onChange={e => setFormData({...formData, source: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL da Imagem</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conteúdo / Descrição</label>
                  <textarea 
                    rows={4} required
                    className="w-full bg-slate-800 border-none p-4 rounded-xl mt-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 font-bold hover:text-white transition-colors">CANCELAR</button>
                <button type="submit" disabled={submitting} className="bg-orange-600 px-10 py-4 rounded-2xl font-black text-white hover:scale-105 transition-all shadow-xl disabled:opacity-50">
                  {submitting ? "ENVIANDO..." : "SALVAR ALTERAÇÕES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
