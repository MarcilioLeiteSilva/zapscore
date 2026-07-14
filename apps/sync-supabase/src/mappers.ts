import { IdMapper } from './id-mapper';

/**
 * Mappers: ZapScore API schema → Supabase Brasileirão schema
 *
 * Mapeia os dados da ZapScore API convertendo os UUIDs locais para os correspondentes
 * UUIDs do Supabase Hosted utilizando o IdMapper.
 */

// ─── MATCH (Fixture → matches) ────────────────────────────────────────────────
export function mapFixtureToMatch(f: any) {
  // Busca UUIDs no Supabase
  const supabaseMatchId = IdMapper.getSupabaseMatchUuid(f.externalId);
  const supabaseLeagueId = IdMapper.getSupabaseLeagueUuid(f.league?.externalId ?? 71);
  const supabaseHomeTeamId = IdMapper.getSupabaseTeamUuid(f.homeTeam?.externalId ?? 0);
  const supabaseAwayTeamId = IdMapper.getSupabaseTeamUuid(f.awayTeam?.externalId ?? 0);

  return {
    id:                      supabaseMatchId ?? f.id,       // Mantém o ID do Supabase ou usa o do ZapScore se for novo
    api_football_fixture_id: f.externalId,                  // id externo da API-Football (int64)
    api_football_league_id:  f.league?.externalId ?? 71,
    league_internal_id:      supabaseLeagueId ?? f.leagueId ?? f.league?.id,
    home_team_id:            supabaseHomeTeamId ?? f.homeTeamId ?? f.homeTeam?.id,
    away_team_id:            supabaseAwayTeamId ?? f.awayTeamId ?? f.awayTeam?.id,
    starts_at:               f.date,
    season:                  f.season,
    round:                   f.round ?? null,
    status:                  f.statusLong ?? null,
    status_short:            f.statusShort ?? null,
    status_long:             f.statusLong ?? null,
    minute:                  f.elapsed != null ? String(f.elapsed) : null,
    elapsed:                 f.elapsed ?? null,
    home_score:              f.homeGoals ?? null,
    away_score:              f.awayGoals ?? null,
    is_live:                 ['1H','2H','HT','ET','P','BT','LIVE'].includes(f.statusShort ?? ''),
    is_finished:             ['FT','AET','PEN'].includes(f.statusShort ?? ''),
    updated_at:              new Date().toISOString(),
  };
}

// ─── TEAMS (Team → teams) ─────────────────────────────────────────────────────
export function mapTeamToSupabase(t: any) {
  const supabaseTeamId = IdMapper.getSupabaseTeamUuid(t.externalId);

  return {
    id:          supabaseTeamId ?? t.id, // Mantém o ID do Supabase ou usa o do Zapscore se for novo
    external_id: String(t.externalId),
    name:        t.name,
    short_name:  t.code ?? null,
    crest_url:   t.logo ?? null,
    // country, founded e national omitidos porque não existem na tabela teams do Supabase
    updated_at:  new Date().toISOString(),
  };
}

// ─── LEAGUE (League → leagues) ────────────────────────────────────────────────
export function mapLeagueToSupabase(l: any) {
  const supabaseLeagueId = IdMapper.getSupabaseLeagueUuid(l.externalId);

  return {
    id:          supabaseLeagueId ?? l.id, // Mantém o ID do Supabase ou usa o do Zapscore se for novo
    external_id: String(l.externalId),
    name:        l.name,
    country:     l.country ?? null,
    logo_url:    l.logo ?? null,
    season:      l.season ?? null,
    type:        l.type ?? null,
  };
}

// ─── STANDINGS (Standing → group_standings) ───────────────────────────────────
export function mapStandingToSupabase(s: any) {
  const supabaseLeagueId = IdMapper.getSupabaseLeagueUuid(s.league?.externalId ?? 71);
  const supabaseTeamId = IdMapper.getSupabaseTeamUuid(s.team?.externalId ?? 0);

  return {
    id:               s.id,
    league_id:        supabaseLeagueId ?? s.leagueId ?? s.league?.id,
    team_id:          supabaseTeamId ?? s.teamId ?? s.team?.id,
    position:         s.rank,
    played:           s.played,
    wins:             s.win,
    draws:            s.draw,
    losses:           s.lose,
    goals_for:        s.goalsFor,
    goals_against:    s.goalsAgainst,
    goal_difference:  s.goalsDiff,
    points:           s.points,
    updated_at:       new Date().toISOString(),
  };
}

// ─── EVENTS (FixtureEvent[] → fixture_events rows) ────────────────────────────
export function mapEventToSupabase(e: any, fixtureExternalId: number) {
  return {
    fixture_id:   fixtureExternalId,   // Supabase usa o externalId da API-Football
    team_id:      e.teamId,
    player_name:  e.player  ?? null,
    assist_name:  e.assist  ?? null,
    type:         e.type,
    detail:       e.detail  ?? null,
    minute:       e.time    ?? null,
    extra:        null,
  };
}

// ─── STATS (FixtureStat[] → fixture_statistics JSONB) ────────────────────────
export function mapStatsToSupabase(
  stats: any[],
  fixtureExternalId: number,
) {
  const byTeam: Record<number, any[]> = {};
  for (const s of stats) {
    if (!byTeam[s.teamId]) byTeam[s.teamId] = [];
    byTeam[s.teamId].push({ type: s.type, value: s.value });
  }

  return Object.entries(byTeam).map(([teamId, statsList]) => ({
    fixture_id:         fixtureExternalId,
    team_api_id:        Number(teamId),
    statistics:         statsList,
    source:             'zapscore-api',
    source_updated_at:  new Date().toISOString(),
    updated_at:         new Date().toISOString(),
  }));
}

// ─── LINEUPS (FixtureLineup[] → fixture_lineups JSONB) ────────────────────────
export function mapLineupsToSupabase(
  lineups: any[],
  fixtureExternalId: number,
) {
  const byTeam: Record<number, { startXI: any[]; substitutes: any[] }> = {};

  for (const p of lineups) {
    if (!byTeam[p.teamId]) byTeam[p.teamId] = { startXI: [], substitutes: [] };
    const entry = {
      name:   p.player,
      number: p.number ?? null,
      pos:    p.pos    ?? null,
      grid:   p.grid   ?? null,
    };
    if (p.isStart) {
      byTeam[p.teamId].startXI.push(entry);
    } else {
      byTeam[p.teamId].substitutes.push(entry);
    }
  }

  return Object.entries(byTeam).map(([teamId, data]) => ({
    fixture_id:         fixtureExternalId,
    team_api_id:        Number(teamId),
    start_xi:           data.startXI,
    substitutes:        data.substitutes,
    source:             'zapscore-api',
    source_updated_at:  new Date().toISOString(),
    updated_at:         new Date().toISOString(),
  }));
}

// ─── SYNC CONTROL (fixture_sync_control) ─────────────────────────────────────
export function mapSyncControl(
  f: any,
  updates: {
    core?: boolean;
    events?: boolean;
    stats?: boolean;
    lineups?: boolean;
    eventCount?: number;
  } = {},
) {
  const supabaseMatchId = IdMapper.getSupabaseMatchUuid(f.externalId);
  const now = new Date().toISOString();

  const record: any = {
    fixture_id:   f.externalId,
    match_id:     supabaseMatchId ?? f.id,
    league_id:    f.league?.externalId ?? 71,
    season:       f.season,
    kickoff_at:   f.date,
    status_short: f.statusShort ?? null,
    is_live:      ['1H','2H','HT','ET','P','BT','LIVE'].includes(f.statusShort ?? ''),
    sync_enabled: true,
    last_home_goals: f.homeGoals ?? null,
    last_away_goals: f.awayGoals ?? null,
    updated_at:   now,
  };
  if (updates.core)    record.last_core_sync_at    = now;
  if (updates.events)  record.last_events_sync_at  = now;
  if (updates.stats)   record.last_stats_sync_at   = now;
  if (updates.lineups) record.last_lineups_sync_at = now;
  if (updates.eventCount !== undefined) record.last_event_count = updates.eventCount;
  return record;
}
