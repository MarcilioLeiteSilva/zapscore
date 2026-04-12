import { ZapScoreApi } from '../../../lib/api-client';
import Link from 'next/link';

export default async function CompetitionPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string, round?: string }>
}) {
  const { id } = await params;
  const { tab = 'tabela', round: selectedRound } = await searchParams;
  const leagueId = parseInt(id);

  const competition = await ZapScoreApi.getCompetitionDetail(leagueId);

  if (!competition) {
    return (
        <div className="container" style={{ padding: '10rem 0', textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem' }}>404</h1>
            <p style={{ color: 'var(--text-muted)' }}>Competição não encontrada.</p>
            <Link href="/" className="badge" style={{ marginTop: '2rem' }}>Voltar para o Início</Link>
        </div>
    );
  }

  // Fetch data
  let data: any = null;
  if (tab === 'tabela') {
    data = await ZapScoreApi.getStanding(leagueId);
  } else if (tab === 'rodadas' || tab === 'jogos') {
    data = await ZapScoreApi.getFixtures({ leagueId, season: 2026 });
  } else if (tab === 'artilharia') {
    data = await ZapScoreApi.getTopScorers(leagueId);
  }

  const tabs = [
    { id: 'tabela', label: 'Classificação' },
    { id: 'rodadas', label: 'Rodadas' },
    { id: 'jogos', label: 'Jogos' },
    { id: 'artilharia', label: 'Artilharia' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Header da Competição */}
      <div className="card glass" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255, 31, 31, 0.05) 100%)' }}>
         <div style={{ width: '90px', height: '90px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
            ⚽
         </div>
         <div>
            <div className="badge badge-ft" style={{ marginBottom: '0.5rem', background: 'rgba(0, 255, 136, 0.1)', color: 'var(--success)' }}>BRASIL • TEMPORADA 2026</div>
            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', fontWeight: '900' }}>{competition.name}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--success)' }}>● SISTEMA ONLINE</span>
                <span>•</span>
                <span>DATA ATUAL: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
         </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', background: 'var(--glass)', padding: '0.5rem', borderRadius: '16px', width: 'fit-content' }}>
        {tabs.map((t) => (
          <Link 
            key={t.id} 
            href={`/competitions/${id}?tab=${t.id}`}
            style={{ 
                padding: '0.8rem 2rem', 
                borderRadius: '12px', 
                fontWeight: '800',
                fontSize: '0.9rem',
                letterSpacing: '0.5px',
                background: tab === t.id ? 'var(--primary)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: tab === t.id ? '0 4px 15px var(--primary-glow)' : 'none'
            }}
          >
            {t.label.toUpperCase()}
          </Link>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div className="fade-in">
        {tab === 'tabela' && <TabelaView standings={data} />}
        {tab === 'rodadas' && <RodadasView fixtures={data} selectedRound={selectedRound} leagueId={id} />}
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
            <th style={{ width: '80px', textAlign: 'center' }}>POS</th>
            <th>CLUBE</th>
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
              <td style={{ textAlign: 'center' }}>
                <span style={{ 
                    display: 'inline-flex', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', 
                    background: item.rank <= 4 ? 'rgba(0, 255, 136, 0.1)' : item.rank >= 17 ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255,255,255,0.03)',
                    color: item.rank <= 4 ? 'var(--success)' : item.rank >= 17 ? 'var(--danger)' : 'white',
                    fontWeight: '900'
                }}>{item.rank}</span>
              </td>
              <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={item.team.logo} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                <span style={{ fontWeight: '700', fontSize: '1rem' }}>{item.team.name}</span>
              </td>
              <td style={{ textAlign: 'center', fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>{item.points}</td>
              <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.played}</td>
              <td style={{ textAlign: 'center' }}>{item.win}</td>
              <td style={{ textAlign: 'center' }}>{item.draw}</td>
              <td style={{ textAlign: 'center' }}>{item.lose}</td>
              <td style={{ textAlign: 'center', fontWeight: '800', color: item.goalsDiff > 0 ? 'var(--success)' : item.goalsDiff < 0 ? 'var(--danger)' : 'white' }}>
                {item.goalsDiff > 0 ? `+${item.goalsDiff}` : item.goalsDiff}
              </td>
            </tr>
          )) : <tr><td colSpan={8} style={{ textAlign: 'center', padding: '5rem' }}>Nenhum dado de classificação disponível.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function RodadasView({ fixtures, selectedRound, leagueId }: { fixtures: any[], selectedRound?: string, leagueId: string }) {
    // Agrupar por rodada
    const roundsMap = fixtures?.reduce((acc: any, f: any) => {
        const rawRound = f.round || 'Outros';
        const r = rawRound.replace('Regular Season - ', 'Rodada ').replace('Group Stage - ', 'Grupo ');
        if (!acc[r]) acc[r] = [];
        acc[r].push(f);
        return acc;
    }, {});

    const sortedRounds = Object.keys(roundsMap || {}).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    // Encontrar a rodada atual se não selecionada
    // (Poderíamos usar a primeira rodada com jogos 'NS' ou 'LIVE')
    const currentRound = selectedRound || sortedRounds.find(r => roundsMap[r].some((f: any) => ['LIVE', '1H', '2H', 'HT', 'NS'].includes(f.statusShort))) || sortedRounds[0];

    const currentIndex = sortedRounds.indexOf(currentRound);
    const prevRound = sortedRounds[currentIndex - 1];
    const nextRound = sortedRounds[currentIndex + 1];

    return (
        <div>
            {/* Navegação de Rodada */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', background: 'var(--glass)', padding: '1rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                {prevRound ? (
                    <Link href={`/competitions/${leagueId}?tab=rodadas&round=${prevRound}`} className="card glass" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '800' }}>
                        ← ANTERIOR
                    </Link>
                ) : <div style={{ width: '100px' }}></div>}

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '900', letterSpacing: '2px', marginBottom: '0.25rem' }}>NAVEGAÇÃO LÓGICA</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{currentRound.toUpperCase()}</div>
                </div>

                {nextRound ? (
                    <Link href={`/competitions/${leagueId}?tab=rodadas&round=${nextRound}`} className="card glass" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '800' }}>
                        PRÓXIMA →
                    </Link>
                ) : <div style={{ width: '100px' }}></div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                {roundsMap[currentRound]?.map((f: any) => (
                    <FixtureCard key={f.id} f={f} />
                ))}
            </div>
        </div>
    );
}

function JogosView({ fixtures }: { fixtures: any[] }) {
    const live = fixtures?.filter(f => ['1H', '2H', 'HT', 'LIVE'].includes(f.statusShort));
    const finished = fixtures?.filter(f => ['FT', 'AET', 'PEN'].includes(f.statusShort));
    const upcoming = fixtures?.filter(f => ['NS', 'TBD'].includes(f.statusShort)).slice(0, 10); // Mostrar top 10 próximos

    const hasLive = live && live.length > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {hasLive && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="badge badge-live" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>AO VIVO AGORA</div>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 77, 77, 0.2)' }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                        {live.map((f: any) => <FixtureCard key={f.id} f={f} />)}
                    </div>
                </section>
            )}

            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>PRÓXIMAS PARTIDAS</h2>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                    {upcoming && upcoming.length > 0 ? upcoming.map((f: any) => <FixtureCard key={f.id} f={f} />) : <p style={{ color: 'var(--text-muted)' }}>Nenhuma partida futura agendada.</p>}
                </div>
            </section>

            {finished && finished.length > 0 && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-muted)' }}>RESULTADOS RECENTES</h2>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem', opacity: 0.8 }}>
                        {finished.slice(0, 10).map((f: any) => <FixtureCard key={f.id} f={f} />)}
                    </div>
                </section>
            )}
        </div>
    );
}

function ArtilhariaView({ scorers }: { scorers: any[] }) {
    return (
        <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '80px 1fr 120px', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '1px' }}>
                <span>RANKING</span>
                <span>JOGADOR / CLUBE</span>
                <span style={{ textAlign: 'right' }}>GOLS</span>
            </div>
            {scorers && scorers.length > 0 ? scorers.map((s, idx) => (
                <div key={idx} style={{ padding: '1.5rem 2rem', borderBottom: idx === scorers.length - 1 ? 'none' : '1px solid var(--border)', display: 'grid', gridTemplateColumns: '80px 1fr 120px', alignItems: 'center', transition: 'background 0.2s' }} className="hover-row">
                    <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.25rem' }}>{idx + 1}º</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <img src={s.player.photo} style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--border)' }} />
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{s.player.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <img src={s.statistics[0].team.logo} style={{ width: '14px' }} />
                                {s.statistics[0].team.name}
                            </div>
                        </div>
                    </div>
                    <span style={{ textAlign: 'right', fontWeight: '950', fontSize: '1.5rem', color: 'var(--text)' }}>{s.statistics[0].goals.total}</span>
                </div>
            )) : <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Dados de artilharia ainda não disponíveis.</div>}
        </div>
    );
}

function FixtureCard({ f }: { f: any }) {
    const isLive = ['LIVE', '1H', '2H', 'HT'].includes(f.statusShort);
    const roundName = f.round?.replace('Regular Season - ', 'Rodada ').replace('Group Stage - ', 'Grupo ') || '';

    return (
        <Link href={`/fixtures/${f.id}`} className="card glass" style={{ display: 'block', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '1.25rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>{new Date(f.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    <span>•</span>
                    <span>{new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>{roundName.toUpperCase()}</span>
                    <span className={isLive ? 'badge badge-live' : 'badge badge-ft'}>{f.statusLong}</span>
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <img src={f.homeTeam.logo} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontWeight: '800', fontSize: '1rem' }}>{f.homeTeam.name}</span>
                </div>
                <div style={{ fontWeight: '900', fontSize: '1.5rem', minWidth: '30px', textAlign: 'center' }}>
                    {f.homeGoals ?? 0}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <img src={f.awayTeam.logo} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontWeight: '800', fontSize: '1rem' }}>{f.awayTeam.name}</span>
                </div>
                <div style={{ fontWeight: '900', fontSize: '1.5rem', minWidth: '30px', textAlign: 'center' }}>
                    {f.awayGoals ?? 0}
                </div>
            </div>
            
            {isLive && f.elapsed && (
                 <div style={{ marginTop: '1rem', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
                    <div style={{ width: `${(f.elapsed / 90) * 100}%`, height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                 </div>
            )}
        </Link>
    );
}
