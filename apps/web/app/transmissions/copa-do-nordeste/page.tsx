import Link from 'next/link';

const overlays = [
  { slug: 'scoreboard', name: 'Placar ao Vivo', icon: '⚽', desc: 'Placar, times e status da partida em tempo real' },
  { slug: 'events', name: 'Eventos', icon: '📋', desc: 'Gols, cartões e substituições ao vivo' },
  { slug: 'lineups', name: 'Escalações', icon: '👥', desc: '11 titulares de cada equipe' },
  { slug: 'stats', name: 'Estatísticas', icon: '📊', desc: 'Posse, finalizações, escanteios e mais (scroll loop)' },
  { slug: 'standings', name: 'Classificação', icon: '🏆', desc: 'Tabela de posições da competição (scroll loop)' },
];

export default function CopaNordesteHub() {
  return (
    <div className="tx-hub">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/transmissions" style={{ color: 'var(--tx-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Voltar para Transmissões
        </Link>
      </div>

      <h1>
        🏆 Copa do <span style={{ color: 'var(--tx-primary)' }}>Nordeste</span>
      </h1>
      <p style={{ color: 'var(--tx-text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>
        League ID: 612 • Selecione um overlay para usar no OBS
      </p>
      <p style={{ color: 'var(--tx-text-muted)', fontSize: '0.85rem', marginBottom: '3rem', maxWidth: '600px' }}>
        💡 <strong>Dica:</strong> Adicione <code>?fixtureId=XXX</code> na URL para selecionar um jogo específico.
        Adicione <code>?speed=slow|normal|fast</code> para controlar a velocidade do scroll.
      </p>

      <div className="tx-hub-grid">
        {overlays.map((overlay) => (
          <Link
            key={overlay.slug}
            href={`/transmissions/copa-do-nordeste/${overlay.slug}`}
            className="tx-hub-link tx-card"
          >
            <div className="tx-hub-link-icon">{overlay.icon}</div>
            <div className="tx-hub-link-title">{overlay.name}</div>
            <div className="tx-hub-link-desc">{overlay.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
