import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'ZapScore | Inteligência em Futebol',
  description: 'Plataforma definitiva de dados para competições brasileiras.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
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
            </nav>
          </div>
        </header>

        <main className="fade-in">
          {children}
        </main>

        <footer style={{ borderTop: '1px solid var(--border)', padding: '4rem 0', marginTop: '4rem' }}>
          <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ZapScore &copy; 2026 — Plataforma de Dados do Futebol Brasileiro
          </div>
        </footer>
      </body>
    </html>
  );
}
