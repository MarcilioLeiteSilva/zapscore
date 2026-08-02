'use client';

import React from "react";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import AppSidebar from "./components/AppSidebar";
import AppHeader from "./components/AppHeader";
import Backdrop from "./components/Backdrop";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered } = useSidebar();
  const sidebarVisible = isExpanded || isHovered;

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 font-sans antialiased flex flex-col">
      {/* Sidebar & Backdrop Mobile */}
      <AppSidebar />
      <Backdrop />

      {/* Main Area Margins dynamically adjust based on Sidebar state */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarVisible ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Header */}
        <AppHeader />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 bg-[#020205] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-black overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
