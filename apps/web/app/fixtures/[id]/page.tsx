import { ZapScoreApi } from '../../../lib/api-client';
import Link from 'next/link';

export default async function FixtureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = await ZapScoreApi.getFixtureDetail(id);

  if (!fixture) {
    return (
        <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>
            <h1 style={{ fontSize: '4rem' }}>404</h1>
            <p style={{ color: 'var(--text-muted)' }}>Partida não encontrada em nossa base de dados.</p>
            <Link href="/fixtures" className="badge" style={{ marginTop: '2rem' }}>Voltar para Jogos</Link>
        </div>
    );
  }

  const isLive = ['1H', '2H', 'HT', 'LIVE'].includes(fixture.statusShort);

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <Link href="/fixtures" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <span style={{ fontSize: '1.2rem' }}>←</span> VOLTAR PARA A AGENDA
      </Link>

      {/* Main Scoreboard Card */}
      <div className="card glass" style={{ padding: '3rem', position: 'relative', marginBottom: '3rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255, 31, 31, 0.03) 100%)' }}>
        
        {isLive && (
            <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="badge badge-live" style={{ padding: '0.5rem 1rem' }}>AO VIVO — {fixture.elapsed}'</div>
            </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '3rem' }}>
          
          {/* Home Team */}
          <div style={{ textAlign: 'center' }}>
            <img src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} style={{ width: '120px', height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.4))' }} />
            <h2 style={{ fontSize: '2rem', marginTop: '1.5rem', fontWeight: '900' }}>{fixture.homeTeam.name}</h2>
          </div>

          {/* Score & Status */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '900', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                {fixture.round?.replace('Regular Season - ', 'RODADA ').toUpperCase()}
            </div>
            <div style={{ fontSize: '5rem', fontWeight: '950', letterSpacing: '-2px', display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                <span style={{ textShadow: '0 0 30px rgba(255,255,255,0.1)' }}>{fixture.homeGoals ?? 0}</span>
                <span style={{ color: 'var(--border)', fontSize: '3rem' }}>:</span>
                <span style={{ textShadow: '0 0 30px rgba(255,255,255,0.1)' }}>{fixture.awayGoals ?? 0}</span>
            </div>
            <div className="badge" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.2rem' }}>
                {fixture.statusLong}
            </div>
            <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
               {new Date(fixture.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} às {new Date(fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Away Team */}
          <div style={{ textAlign: 'center' }}>
            <img src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} style={{ width: '120px', height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.4))' }} />
            <h2 style={{ fontSize: '2rem', marginTop: '1.5rem', fontWeight: '900' }}>{fixture.awayTeam.name}</h2>
          </div>

        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
            {fixture.venueName} • {fixture.venueCity} • {fixture.round}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
        
        {/* Left Column: Timeline & Lineups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Timeline Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                <h3 style={{ fontSize: '1.5rem' }}>Linha do <span style={{ color: 'var(--primary)' }}>Tempo</span></h3>
            </div>
            
            <div className="card glass" style={{ padding: '0' }}>
              {fixture.events && fixture.events.length > 0 ? (
                fixture.events.map((event: any, idx: number) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.5rem', 
                    padding: '1.25rem 1.5rem',
                    borderBottom: idx === fixture.events.length - 1 ? 'none' : '1px solid var(--border)',
                    background: event.type === 'Goal' ? 'rgba(255, 31, 31, 0.02)' : 'transparent'
                  }}>
                    <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem', width: '40px' }}>{event.time}'</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem' }}>{event.player}</span>
                        {event.type === 'Goal' && <span style={{ fontSize: '1.2rem' }}>⚽</span>}
                        {event.type === 'Card' && (
                            <div style={{ width: '12px', height: '16px', background: event.detail.includes('Yellow') ? '#ffd700' : '#ff0000', borderRadius: '2px' }}></div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: '500' }}>
                          {event.detail}
                          {event.assist && <span style={{ opacity: 0.6 }}> • Assitência: {event.assist}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aguardando eventos da partida...
                </div>
              )}
            </div>
          </section>

          {/* Lineups Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                <h3 style={{ fontSize: '1.5rem' }}>Ficha Técnica <span style={{ color: 'var(--primary)' }}>Escalações</span></h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card glass">
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={fixture.homeTeam.logo} style={{ width: '20px' }} /> {fixture.homeTeam.name}
                    </h4>
                    {fixture.lineups?.filter((l: any) => l.teamId === fixture.homeTeam.externalId && l.isStart).map((p: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.8rem', width: '20px' }}>{p.number}</span>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.player}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800' }}>{p.pos}</span>
                        </div>
                    ))}
                </div>
                
                <div className="card glass">
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <img src={fixture.awayTeam.logo} style={{ width: '20px' }} /> {fixture.awayTeam.name}
                    </h4>
                    {fixture.lineups?.filter((l: any) => l.teamId === fixture.awayTeam.externalId && l.isStart).map((p: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.8rem', width: '20px' }}>{p.number}</span>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.player}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800' }}>{p.pos}</span>
                        </div>
                    ))}
                </div>
            </div>
          </section>
        </div>

        {/* Right Column: Statistics */}
        <aside>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }}></div>
              <h3 style={{ fontSize: '1.5rem' }}>Estatísticas <span style={{ color: 'var(--primary)' }}>Gerais</span></h3>
          </div>

          <div className="card glass" style={{ padding: '2rem' }}>
            {fixture.stats && fixture.stats.length > 0 ? (
                fixture.stats.map((stat: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span>{stat.type}</span>
                            <span style={{ color: 'var(--primary)', fontSize: '1rem' }}>{stat.value}</span>
                        </div>
                        <div className="stat-bar-container">
                            <div className="stat-bar-fill" style={{ 
                                width: stat.value.includes('%') ? stat.value : (parseInt(stat.value) > 20 ? '90%' : `${parseInt(stat.value) * 5}%`), 
                            }}></div>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
                    <p style={{ color: 'var(--text-muted)' }}>Dados estatísticos serão populados durante a partida.</p>
                </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
