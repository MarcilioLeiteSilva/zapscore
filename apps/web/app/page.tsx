import { ZapScoreApi } from '../lib/api-client';
import Link from 'next/link';

export default async function HomePage() {
  let health: any = null;
  let competitions: any[] = [];
  
  try {
    const [h, c] = await Promise.all([
      ZapScoreApi.getHealth(),
      ZapScoreApi.getCompetitions()
    ]);
    health = h;
    competitions = c;
  } catch (err) {
    console.error('Failed to fetch initial data:', err);
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <div className="badge badge-ft" style={{ marginBottom: '1.5rem', background: 'rgba(255, 31, 31, 0.1)', color: 'var(--primary)', borderColor: 'rgba(255, 31, 31, 0.2)' }}>
           Fase 2: Temporada 2026 Ativa
        </div>
        <h1>Dados em Tempo Real do Futebol <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>Brasileiro</span></h1>
        <p>A plataforma definitiva para desenvolvedores e entusiastas que buscam precisão, velocidade e inteligência esportiva escalável.</p>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <Link href="/fixtures" className="card glass" style={{ padding: '1.25rem 2.5rem', background: 'var(--primary)', borderColor: 'var(--primary)', fontWeight: '900', letterSpacing: '1px' }}>
             VER JOGOS DE HOJE →
          </Link>
          <Link href="/standings" className="card glass" style={{ padding: '1.25rem 2.5rem', fontWeight: '700' }}>
             Classificação
          </Link>
        </div>
      </section>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', marginTop: '2rem' }}>
        
        {/* Competitions Card */}
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>🏆 Principais Ligas</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>{competitions.length} MONITORADAS</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {competitions.length > 0 ? competitions.map((comp) => (
              <Link key={comp.code} href={`/competitions/${comp.externalId}`}>
              <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        ⚽
                    </div>
                    <div>
                        <div style={{ fontWeight: '700' }}>{comp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brasil • Serie A</div>
                    </div>
                </div>
                <div className="badge badge-ft">Online</div>
              </div>
              </Link>
            )) : <p style={{ color: 'var(--text-muted)' }}>Sincronizando competições...</p>}
          </div>
        </div>

        {/* Platform Status */}
        <div className="card glass" style={{ background: 'linear-gradient(180deg, var(--surface) 0%, rgba(255, 31, 31, 0.05) 100%)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>⚡ Engine Status</h2>
          
          {health ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: '600' }}>HEALTH CHECK</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>Sistema Operacional</span>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="glass" style={{ padding: '1rem', borderRadius: '16px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Versão</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '0.25rem' }}>{health.version}</div>
                    </div>
                    <div className="glass" style={{ padding: '1rem', borderRadius: '16px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Ambiente</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--success)' }}>{health.environment}</div>
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: '600' }}>RECORTE TEMPORAL ATIVO</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>
                        {health.vision.active_season}
                    </div>
                </div>
             </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <p style={{ color: 'var(--danger)', fontWeight: '700' }}>API OFFLINE</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verifique a conexão com o banco de dados.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
