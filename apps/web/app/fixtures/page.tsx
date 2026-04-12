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
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
           <div className="badge badge-ft" style={{ marginBottom: '0.5rem' }}>Ao Vivo & Próximos</div>
           <h1 style={{ fontSize: '3rem' }}>Partidas de <span style={{ color: 'var(--primary)' }}>Hoje</span></h1>
        </div>
        <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
            {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {fixtures.length === 0 ? (
        <div className="card glass" style={{ padding: '6rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏟️</div>
          <h2 style={{ marginBottom: '1rem' }}>Silêncio no Estádio</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>
            Não há partidas agendadas para o recorte selecionado hoje.
          </p>
          <Link href="/" className="badge" style={{ marginTop: '2rem', padding: '1rem 2rem' }}>
             Voltar para Início
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
          {fixtures.map((fixture) => (
            <Link 
              key={fixture.id} 
              href={`/fixtures/${fixture.id}`} 
              className="card glass"
              style={{ display: 'block' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{fixture.league.name.toUpperCase()}</span>
                <span className={`badge ${fixture.statusShort === 'LIVE' ? 'badge-live' : 'badge-ft'}`}>
                    {fixture.statusLong}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <div style={{ textAlign: 'center', width: '35%' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: '800', marginTop: '0.75rem', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fixture.homeTeam.name}
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', display: 'flex', justifyContent: 'center', gap: '0.75rem', color: fixture.homeGoals !== null ? 'var(--text)' : 'var(--text-muted)' }}>
                        <span>{fixture.homeGoals ?? '0'}</span>
                        <span style={{ color: 'var(--border)' }}>:</span>
                        <span>{fixture.awayGoals ?? '0'}</span>
                    </div>
                    {fixture.elapsed && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '800', marginTop: '0.25rem' }}>
                            {fixture.elapsed}' <span className="badge-live" style={{ padding: '2px 4px', fontSize: '0.6rem' }}></span>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', width: '35%' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: '800', marginTop: '0.75rem', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fixture.awayTeam.name}
                    </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                <span>📍 {fixture.venueName || 'Estádio Indefinido'}</span>
                <span>•</span>
                <span>⏰ {new Date(fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
