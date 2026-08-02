import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#020205] text-slate-100 font-sans antialiased">
      {/* ZapScore Official Header (Com Padding de 20px nas Laterais) */}
      <header className="header w-full border-b border-[var(--glass-border)] bg-[#020205]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1650px] mx-auto px-5 w-full h-[76px] flex items-center justify-between">
          <Link href="/" className="logo flex items-center gap-3">
            <div className="logo-icon w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
              <span className="text-lg">⚡</span>
            </div>
            <span className="text-xl font-black tracking-tight text-white italic">
              ZAP<span className="text-[var(--primary)]">SCORE</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-8">
            <Link href="/fixtures" className="nav-link text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors">Jogos</Link>
            <Link href="/standings" className="nav-link text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors">Classificação</Link>
            <Link href="/adminpanel" className="px-4 py-2 rounded-xl text-sm font-black bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-white transition-all shadow-md">Admin</Link>
          </nav>
        </div>
      </header>

      {/* Area Principal (Margens Laterais de 20px) */}
      <main className="fade-in flex-1 w-full max-w-[1650px] mx-auto px-5 py-6">
        {children}
      </main>

      {/* Rodapé Oficial ZapScore */}
      <footer className="w-full border-t border-[var(--border)] py-8 mt-12 bg-black/40">
        <div className="max-w-[1650px] mx-auto px-5 text-center text-xs font-semibold text-[var(--text-muted)]">
          ZapScore &copy; 2026 — Plataforma de Dados e Inteligência do Futebol
        </div>
      </footer>
    </div>
  );
}
