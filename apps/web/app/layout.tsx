import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ZapScore — Brazilian Football Data Platform',
  description: 'Scalable data platform for all Brazilian football competitions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <header className="header">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="logo">ZAP<span>SCORE</span></div>
            <nav className="nav">
              <a href="/" className="nav-link">Home</a>
              <a href="/fixtures" className="nav-link">Jogos</a>
              <a href="/standings" className="nav-link">Classificação</a>
            </nav>
          </div>
        </header>
        <main style={{ padding: '2rem 0' }}>
          {children}
        </main>
        <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: '4rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            ZapScore &copy; 2026 — Plataforma de Dados do Futebol Brasileiro
          </div>
        </footer>
      </body>
    </html>
  );
}
