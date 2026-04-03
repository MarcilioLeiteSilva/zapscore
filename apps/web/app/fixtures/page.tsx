import { ZapScoreApi } from '../../lib/api-client';
import Link from 'next/link';

export default async function FixturesPage() {
  let fixtures: any[] = [];
  try {
    fixtures = await ZapScoreApi.getFixturesToday();
  } catch (err) {
    console.error('Failed to fetch fixtures:', err);
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Próximos <span style={{ color: 'var(--primary)' }}>Jogos</span></h1>
      
      {fixtures.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '1.2rem' }}>
            Nenhuma partida encontrada para hoje. Tente mudar os filtros ou sincronizar no backend.
          </p>
        </div>
      ) : (
        <div className="grid-fixtures">
      {fixtures.map((fixture) => (
        <Link 
          key={fixture.id} 
          href={`/fixtures/${fixture.id}`} 
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
              <span>{fixture.league.name} — Rodada {fixture.round || '?'}</span>
              <span className={`badge`}>{fixture.statusLong}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <img src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} style={{ width: '48px', height: '48px' }} />
                <div style={{ fontWeight: '700', marginTop: '0.5rem', fontSize: '1rem' }}>{fixture.homeTeam.name}</div>
              </div>
              
              <div style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', gap: '1rem' }}>
                <span>{fixture.homeGoals ?? ''}</span>
                <span>-</span>
                <span>{fixture.awayGoals ?? ''}</span>
              </div>

              <div style={{ textAlign: 'center', width: '40%' }}>
                <img src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} style={{ width: '48px', height: '48px' }} />
                <div style={{ fontWeight: '700', marginTop: '0.5rem', fontSize: '1rem' }}>{fixture.awayTeam.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>
              <span>{new Date(fixture.date).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} — {fixture.venueName}</span>
            </div>
          </div>
        </Link>
      ))}
        </div>
      )}
    </div>
  );
}
