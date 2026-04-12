import { ZapScoreApi } from '../../lib/api-client';

export default async function StandingsPage() {
  let standings: any[] = [];
  try {
    // Default to League 71 / Season 2026 for now
    standings = await ZapScoreApi.getStanding(71, 2026);
  } catch (err) {
    console.error('Failed to fetch standings:', err);
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: '8px', height: '40px', background: 'var(--primary)', borderRadius: '4px' }}></div>
          <h1 style={{ fontSize: '3.5rem' }}>Classificação <span style={{ color: 'var(--primary)' }}>Série A</span></h1>
      </div>
      
      <div className="table-wrapper glass">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Posição</th>
              <th>Clube</th>
              <th style={{ width: '80px', textAlign: 'center' }}>PTS</th>
              <th style={{ width: '60px', textAlign: 'center' }}>J</th>
              <th style={{ width: '60px', textAlign: 'center' }}>V</th>
              <th style={{ width: '60px', textAlign: 'center' }}>E</th>
              <th style={{ width: '60px', textAlign: 'center' }}>D</th>
              <th style={{ width: '80px', textAlign: 'center' }}>SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.length > 0 ? (
              standings.map((item) => (
                <tr key={item.id} style={{ transition: 'background 0.2s' }}>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                        display: 'inline-flex', 
                        width: '32px', 
                        height: '32px', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '8px', 
                        background: item.rank <= 4 ? 'rgba(0, 255, 136, 0.1)' : item.rank >= 17 ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255,255,255,0.03)',
                        color: item.rank <= 4 ? 'var(--success)' : item.rank >= 17 ? 'var(--danger)' : 'var(--text)',
                        fontWeight: '900',
                        fontSize: '0.9rem'
                    }}>
                        {item.rank}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img 
                        src={item.team.logo} 
                        alt={item.team.name} 
                        style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                      />
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>{item.team.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '1.1rem', color: 'var(--text)' }}>{item.points}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>{item.played}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.win}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.draw}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.lose}</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: item.goalsDiff > 0 ? 'var(--success)' : item.goalsDiff < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {item.goalsDiff > 0 ? `+${item.goalsDiff}` : item.goalsDiff}
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Nenhum dado de classificação sincronizado.</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Execute o bootstrap no backend para popular as tabelas.</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(0, 255, 136, 0.2)', border: '1px solid var(--success)' }}></div>
            Libertadores
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255, 77, 77, 0.2)', border: '1px solid var(--danger)' }}></div>
            Rebaixamento
        </div>
      </div>
    </div>
  );
}
