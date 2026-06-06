import Link from 'next/link';

const competitions = [
  {
    slug: 'copa-do-nordeste',
    name: 'Copa do Nordeste',
    leagueId: 612,
    emoji: '🏆',
  },
  {
    slug: 'copa-2026',
    name: 'Copa do Mundo FIFA 2026',
    leagueId: 1,
    emoji: '🌍',
  },
];

export default function TransmissionsHub() {
  return (
    <div className="tx-hub">
      <h1>
        ⚡ ZapScore <span style={{ color: 'var(--tx-primary)' }}>Transmissões</span>
      </h1>
      <p style={{ color: 'var(--tx-text-muted)', fontSize: '1.1rem', marginBottom: '3rem' }}>
        Selecione uma competição para acessar os overlays de transmissão para OBS.
      </p>

      <div className="tx-hub-grid">
        {competitions.map((comp) => (
          <Link
            key={comp.slug}
            href={`/transmissions/${comp.slug}`}
            className="tx-hub-link tx-card"
          >
            <div className="tx-hub-link-icon">{comp.emoji}</div>
            <div className="tx-hub-link-title">{comp.name}</div>
            <div className="tx-hub-link-desc">
              League ID: {comp.leagueId} • Overlays disponíveis
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
