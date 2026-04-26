import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Newspaper, Video, Settings, Menu } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZapScore Admin",
  description: "Portal Administrativo ZapScore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <div className="flex min-h-screen relative">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col sticky top-0 h-screen z-10">
            <div className="p-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                ZapScore Admin
              </h1>
            </div>
            <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
              <Link href="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-all text-slate-100 hover:text-white cursor-pointer">
                <LayoutDashboard size={20} className="text-orange-500" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link href="/news" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-all text-slate-100 hover:text-white cursor-pointer">
                <Newspaper size={20} className="text-orange-500" />
                <span className="font-medium">Notícias</span>
              </Link>
              <Link href="/videos" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-all text-slate-100 hover:text-white cursor-pointer">
                <Video size={20} className="text-orange-500" />
                <span className="font-medium">Vídeos</span>
              </Link>
            </nav>
            <div className="p-4 border-t border-slate-800">
              <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-all text-slate-100 hover:text-white cursor-pointer">
                <Settings size={20} className="text-slate-300" />
                <span className="font-medium">Configurações</span>
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-slate-950 p-8 relative z-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
