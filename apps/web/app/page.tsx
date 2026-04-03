import { ZapScoreApi } from '../lib/api-client';

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
      <section style={{ marginBottom: '4rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Futebol <span style={{ color: 'var(--primary)' }}>Brasileiro</span> Escalável</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>
          A ZapScore é a central definitiva de dados para todas as competições do Brasil. 
          De Estaduais à Série A, com tecnologia de ponta e atualização em tempo real.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>🏆 Competições</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {competitions.length > 0 ? competitions.map((comp) => (
              <div key={comp.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--secondary)', borderRadius: '8px' }}>
                <div>
                    <div style={{ fontWeight: '700' }}>{comp.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>ID Externo: {comp.externalId}</div>
                </div>
                <div className="badge badge-ft">Ativa</div>
              </div>
            )) : <p style={{ color: 'var(--muted)' }}>Carregando competições...</p>}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>⚡ Status da Plataforma</h2>
          {health ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Versão</span>
                    <span style={{ fontWeight: '700' }}>{health.version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ambiente</span>
                    <span style={{ color: 'var(--success)' }}>{health.environment}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Recorte Ativo</span>
                    <span style={{ fontWeight: '700' }}>{health.vision.active_season}</span>
                </div>
             </div>
          ) : <p style={{ color: 'var(--muted)' }}>Serviço offline</p>}
        </div>
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <a href="/fixtures" className="card" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'var(--primary)', color: 'white', fontWeight: '800', border: 'none' }}>
           VER JOGOS DE HOJE →
        </a>
      </div>
    </div>
  );
}
