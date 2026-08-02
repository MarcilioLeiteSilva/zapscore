import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* ZapScore Official Header (100% Width) */}
      <header className="header w-full">
        <div className="w-full px-6 md:px-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="logo">
            <div className="logo-icon">
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
            </div>
            ZAP<span>SCORE</span>
          </Link>
          
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/fixtures" className="nav-link">Jogos</Link>
            <Link href="/standings" className="nav-link">Classificação</Link>
            <Link href="/adminpanel" className="nav-link" style={{ color: 'var(--primary)', fontWeight: '700' }}>Admin</Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area (100% Width) */}
      <main className="fade-in flex-1 w-full">
        {children}
      </main>

      {/* ZapScore Official Footer (100% Width) */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: '4rem' }} className="w-full">
        <div className="w-full px-6 md:px-8" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ZapScore &copy; 2026 — Plataforma de Dados do Futebol Brasileiro
        </div>
      </footer>
    </div>
  );
}
