import { ZapScoreApi } from '../../../lib/api-client';
import Link from 'next/link';

export default async function FixtureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = await ZapScoreApi.getFixtureDetail(id);

  if (!fixture) {
    return <div className="container">Partida não encontrada.</div>;
  }

  return (
    <div className="container">
      <Link href="/fixtures" className="badge" style={{ marginBottom: '1rem', display: 'inline-block', textDecoration: 'none' }}>
        ← Voltar para Jogos
      </Link>

      {/* Header do Placar */}
      <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <img src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} style={{ width: '80px', height: '80px', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem' }}>{fixture.homeTeam.name}</h2>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '4px' }}>
              {fixture.homeGoals ?? 0} - {fixture.awayGoals ?? 0}
            </div>
            <div className="badge" style={{ marginTop: '0.5rem' }}>{fixture.statusLong}</div>
            <div style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{fixture.venueName}, {fixture.venueCity}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <img src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} style={{ width: '80px', height: '80px', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem' }}>{fixture.awayTeam.name}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Timeline Events */}
        <div>
          <h3 style={{ marginBottom: '1.5rem' }}>Linha do <span style={{ color: 'var(--primary)' }}>Tempo</span></h3>
          <div className="card" style={{ padding: '1.5rem' }}>
            {fixture.events && fixture.events.length > 0 ? (
              fixture.events.map((event: any, idx: number) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '0.75rem 0',
                  borderBottom: idx === fixture.events.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ fontWeight: '800', color: 'var(--primary)', width: '30px' }}>{event.time}'</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '700' }}>{event.player}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {event.type === 'Goal' ? '⚽ Gol' : event.type === 'Card' ? `🟨 ${event.detail}` : event.detail}
                        {event.assist && ` (Assiste: ${event.assist})`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--muted)' }}>Nenhum evento registrado ainda.</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h3 style={{ marginBottom: '1.5rem' }}>Estatísticas <span style={{ color: 'var(--primary)' }}>Técnicas</span></h3>
          <div className="card" style={{ padding: '1.5rem' }}>
            {fixture.stats && fixture.stats.length > 0 ? (
                 // Agruparemos por tipo aqui se necessário, mas por enquanto listagem simples
                fixture.stats.map((stat: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                            <span>{stat.type}</span>
                            <span style={{ fontWeight: '800' }}>{stat.value}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                            <div style={{ 
                                height: '100%', 
                                width: stat.value.includes('%') ? stat.value : '50%', 
                                background: 'var(--primary)',
                                borderRadius: '2px'
                            }}></div>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: 'var(--muted)' }}>Estatísticas não disponíveis para esta partida.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lineups */}
      <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Ficha Técnica: <span style={{ color: 'var(--primary)' }}>Escalações</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{fixture.homeTeam.name}</h4>
                    {fixture.lineups?.filter((l: any) => l.teamId === fixture.homeTeam.externalId && l.isStart).map((p: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.25rem 0', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: '800', marginRight: '0.5rem', color: 'var(--muted)' }}>{p.number}</span>
                            {p.player} <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>({p.pos})</span>
                        </div>
                    ))}
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{fixture.awayTeam.name}</h4>
                    {fixture.lineups?.filter((l: any) => l.teamId === fixture.awayTeam.externalId && l.isStart).map((p: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.25rem 0', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: '800', marginRight: '0.5rem', color: 'var(--muted)' }}>{p.number}</span>
                            {p.player} <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>({p.pos})</span>
                        </div>
                    ))}
                </div>
          </div>
      </div>
    </div>
  );
}
