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
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Tabela de <span style={{ color: 'var(--primary)' }}>Classificação</span></h1>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Pos</th>
              <th>Clube</th>
              <th style={{ width: '60px' }}>P</th>
              <th style={{ width: '50px' }}>J</th>
              <th style={{ width: '50px' }}>V</th>
              <th style={{ width: '50px' }}>E</th>
              <th style={{ width: '50px' }}>D</th>
              <th style={{ width: '60px' }}>SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.length > 0 ? (
              standings.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '800', textAlign: 'center' }}>{item.rank}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={item.team.logo} alt={item.team.name} style={{ width: '24px', height: '24px' }} />
                      <span style={{ fontWeight: '700' }}>{item.team.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '800' }}>{item.points}</td>
                  <td>{item.played}</td>
                  <td>{item.win}</td>
                  <td>{item.draw}</td>
                  <td>{item.lose}</td>
                  <td style={{ color: item.goalsDiff > 0 ? 'var(--success)' : item.goalsDiff < 0 ? 'var(--danger)' : 'inherit' }}>
                    {item.goalsDiff > 0 ? `+${item.goalsDiff}` : item.goalsDiff}
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        Nenhum dado de classificação disponível.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
