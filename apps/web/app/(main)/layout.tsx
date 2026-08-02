import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ZapScore Official Header */}
      <header className="header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Main Content Area */}
      <main className="fade-in flex-1">
        {children}
      </main>

      {/* ZapScore Official Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '3rem 0', marginTop: '4rem' }}>
        <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ZapScore &copy; 2026 — Plataforma de Dados do Futebol Brasileiro
        </div>
      </footer>
    </div>
  );
}
