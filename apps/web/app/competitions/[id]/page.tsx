import { ZapScoreApi } from '../../../lib/api-client';
import Link from 'next/link';

export default async function CompetitionPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params;
  const { tab = 'tabela' } = await searchParams;
  const leagueId = parseInt(id);

  const competition = await ZapScoreApi.getCompetitionDetail(leagueId);

  if (!competition) {
    return <div className="container">Competição não econtrada.</div>;
  }

  // Fetch data based on active tab
  let data: any = null;
  if (tab === 'tabela') {
    data = await ZapScoreApi.getStanding(leagueId);
  } else if (tab === 'rodadas') {
    data = await ZapScoreApi.getFixtures({ leagueId, season: 2026 });
  } else if (tab === 'jogos') {
    data = await ZapScoreApi.getFixturesToday(leagueId);
  } else if (tab === 'artilharia') {
    data = await ZapScoreApi.getTopScorers(leagueId);
  }

  const tabs = [
    { id: 'tabela', label: 'Tabela' },
    { id: 'rodadas', label: 'Rodadas' },
    { id: 'jogos', label: 'Jogos' },
    { id: 'artilharia', label: 'Artilharia' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Header da Competição */}
      <div className="card glass" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
         <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
            ⚽
         </div>
         <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{competition.name}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                <span>🇧🇷 Brasil</span>
                <span>•</span>
                <span>Temporada 2026</span>
                <span>•</span>
                <span style={{ color: 'var(--success)' }}>Ativa</span>
            </div>
         </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        {tabs.map((t) => (
          <Link 
            key={t.id} 
            href={`?tab=${t.id}`}
            style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '12px', 
                fontWeight: '700',
                background: tab === t.id ? 'var(--primary)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s'
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div className="fade-in">
        {tab === 'tabela' && <TabelaView standings={data} />}
        {tab === 'rodadas' && <RodadasView fixtures={data} />}
        {tab === 'jogos' && <JogosView fixtures={data} />}
        {tab === 'artilharia' && <ArtilhariaView scorers={data} />}
      </div>
    </div>
  );
}

function TabelaView({ standings }: { standings: any[] }) {
  return (
    <div className="table-wrapper glass">
      <table>
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>#</th>
            <th>Clube</th>
            <th style={{ textAlign: 'center' }}>PTS</th>
            <th style={{ textAlign: 'center' }}>J</th>
            <th style={{ textAlign: 'center' }}>V</th>
            <th style={{ textAlign: 'center' }}>E</th>
            <th style={{ textAlign: 'center' }}>D</th>
            <th style={{ textAlign: 'center' }}>SG</th>
          </tr>
        </thead>
        <tbody>
          {standings && standings.length > 0 ? standings.map((item) => (
            <tr key={item.id}>
              <td style={{ textAlign: 'center', fontWeight: '900' }}>{item.rank}</td>
              <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={item.team.logo} style={{ width: '28px' }} />
                <span style={{ fontWeight: '700' }}>{item.team.name}</span>
              </td>
              <td style={{ textAlign: 'center', fontWeight: '900', color: 'var(--primary)' }}>{item.points}</td>
              <td style={{ textAlign: 'center' }}>{item.played}</td>
              <td style={{ textAlign: 'center' }}>{item.win}</td>
              <td style={{ textAlign: 'center' }}>{item.draw}</td>
              <td style={{ textAlign: 'center' }}>{item.lose}</td>
              <td style={{ textAlign: 'center', fontWeight: '700' }}>{item.goalsDiff}</td>
            </tr>
          )) : <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>Dados indisponíveis.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function RodadasView({ fixtures }: { fixtures: any[] }) {
    // Agrupar por rodada
    const rounds = fixtures?.reduce((acc: any, f: any) => {
        const rawRound = f.round || 'Outros';
        const r = rawRound.replace('Regular Season - ', 'Rodada ').replace('Group Stage - ', 'Grupo ');
        if (!acc[r]) acc[r] = [];
        acc[r].push(f);
        return acc;
    }, {});

    // Ordenar rodadas numericamente se possível
    const sortedRounds = Object.keys(rounds || {}).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {sortedRounds.map((round) => (
                <div key={round}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.25rem 0.75rem', background: 'var(--primary)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '900' }}>
                            {round.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {rounds[round].map((f: any) => (
                            <FixtureCard key={f.id} f={f} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function JogosView({ fixtures }: { fixtures: any[] }) {
    const live = fixtures?.filter(f => ['1H', '2H', 'HT', 'LIVE'].includes(f.statusShort));
    const finished = fixtures?.filter(f => ['FT', 'AET', 'PEN'].includes(f.statusShort));
    const upcoming = fixtures?.filter(f => ['NS', 'TBD'].includes(f.statusShort));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {live?.length > 0 && (
                <section>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge-live" style={{ width: '10px', height: '10px', borderRadius: '50%' }}></span>
                        AO VIVO AGORA
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {live.map((f: any) => <FixtureCard key={f.id} f={f} />)}
                    </div>
                </section>
            )}

            <section>
                <h2 style={{ marginBottom: '1.5rem' }}>PRÓXIMOS JOGOS</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {upcoming?.length > 0 ? upcoming.map((f: any) => <FixtureCard key={f.id} f={f} />) : <p style={{ color: 'var(--text-muted)' }}>Nenhum jogo próximo hoje.</p>}
                </div>
            </section>

            {finished?.length > 0 && (
                <section>
                    <h2 style={{ marginBottom: '1.5rem' }}>DESTAQUES DO DIA (ENCERRADOS)</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {finished.map((f: any) => <FixtureCard key={f.id} f={f} />)}
                    </div>
                </section>
            )}
        </div>
    );
}

function ArtilhariaView({ scorers }: { scorers: any[] }) {
    return (
        <div className="card glass" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '60px 1fr 100px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span>POS</span>
                <span>JOGADOR</span>
                <span style={{ textAlign: 'right' }}>GOLS</span>
            </div>
            {scorers?.map((s, idx) => (
                <div key={idx} style={{ padding: '1.5rem 2rem', borderBottom: idx === scorers.length - 1 ? 'none' : '1px solid var(--border)', display: 'grid', gridTemplateColumns: '60px 1fr 100px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '900', color: 'var(--primary)' }}>{idx + 1}º</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={s.player.photo} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass)' }} />
                        <div>
                            <div style={{ fontWeight: '700' }}>{s.player.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.statistics[0].team.name}</div>
                        </div>
                    </div>
                    <span style={{ textAlign: 'right', fontWeight: '900', fontSize: '1.2rem' }}>{s.statistics[0].goals.total}</span>
                </div>
            ))}
        </div>
    );
}

function FixtureCard({ f }: { f: any }) {
    return (
        <Link href={`/fixtures/${f.id}`} className="card glass" style={{ display: 'block', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                <span>{new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={['LIVE', '1H', '2H', 'HT'].includes(f.statusShort) ? 'badge-live' : 'badge-ft'}>{f.statusLong}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <img src={f.homeTeam.logo} style={{ width: '32px' }} />
                    <span style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.homeTeam.name}</span>
                </div>
                <div style={{ padding: '0 1rem', fontWeight: '900', fontSize: '1.2rem' }}>
                    {f.homeGoals ?? 0}
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <img src={f.awayTeam.logo} style={{ width: '32px' }} />
                    <span style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.awayTeam.name}</span>
                </div>
                <div style={{ padding: '0 1rem', fontWeight: '900', fontSize: '1.2rem' }}>
                    {f.awayGoals ?? 0}
                </div>
            </div>
        </Link>
    );
}
