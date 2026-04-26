import React from "react";
import Link from "next/link";
import { Newspaper, Video, LayoutDashboard, ChevronLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <Link href="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6 group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Voltar ao Site</span>
          </Link>
          <h1 className="text-3xl font-black bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent italic tracking-tighter">ZAPSCORE</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1 uppercase">Painel Administrativo</p>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <Link 
            href="/adminpanel" 
            className="flex items-center space-x-3 w-full p-4 rounded-2xl hover:bg-slate-800 transition-all text-white font-bold group"
          >
            <LayoutDashboard size={20} className="text-slate-400 group-hover:text-orange-500" />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/adminpanel/news" 
            className="flex items-center space-x-3 w-full p-4 rounded-2xl hover:bg-slate-800 transition-all text-white font-bold group"
          >
            <Newspaper size={20} className="text-slate-400 group-hover:text-orange-500" />
            <span>Notícias</span>
          </Link>

          <Link 
            href="/adminpanel/videos" 
            className="flex items-center space-x-3 w-full p-4 rounded-2xl hover:bg-slate-800 transition-all text-white font-bold group"
          >
            <Video size={20} className="text-slate-400 group-hover:text-orange-500" />
            <span>Vídeos</span>
          </Link>
        </nav>

        <div className="p-8 border-t border-slate-800">
           <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Conexão API</p>
              <div className="flex items-center space-x-2 text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-black uppercase tracking-tighter">Produção Online</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="absolute inset-0 bg-slate-950/50 pointer-events-none"></div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
