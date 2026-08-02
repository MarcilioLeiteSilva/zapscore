import React from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Sidebar Modular Categorizado */}
      <AdminSidebar />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header com Breadcrumb e Badges de Conexão */}
        <AdminHeader />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          <div className="absolute inset-0 bg-slate-950/70 pointer-events-none"></div>
          <div className="relative z-10 p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
