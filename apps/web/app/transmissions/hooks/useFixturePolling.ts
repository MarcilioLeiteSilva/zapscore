'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getApiUrl(endpoint: string): string {
  let base = API_BASE_URL;
  if (base && !base.startsWith('http')) {
    base = `https://${base}`;
  }
  return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

interface FixtureData {
  id: string;
  externalId: number;
  date: string;
  round: string;
  statusLong: string;
  statusShort: string;
  elapsed: number | null;
  venueName: string;
  venueCity: string;
  referee?: string;
  homeTeam: {
    externalId: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    externalId: number;
    name: string;
    logo: string;
  };
  homeGoals: number | null;
  awayGoals: number | null;
  events: Array<{
    time: number;
    teamId: number;
    player: string;
    assist: string | null;
    type: string;
    detail: string;
  }>;
  stats: Array<{
    teamId: number;
    type: string;
    value: string;
  }>;
  lineups: Array<{
    teamId: number;
    player: string;
    number: number;
    pos: string;
    isStart: boolean;
  }>;
  league: {
    externalId: number;
    name: string;
    logo: string;
  };
}

interface UseFixturePollingResult {
  fixture: FixtureData | null;
  fixtures: FixtureData[];
  loading: boolean;
  error: string | null;
}

async function apiFetch(url: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

// Find the best fixture: live > next upcoming > most recent finished
function pickBestFixture(fixtures: FixtureData[]): FixtureData | null {
  if (!fixtures || fixtures.length === 0) return null;

  const live = fixtures.find((f) =>
    ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.statusShort)
  );
  if (live) return live;

  const upcoming = fixtures
    .filter((f) => ['NS', 'TBD'].includes(f.statusShort))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (upcoming.length > 0) return upcoming[0];

  const finished = fixtures
    .filter((f) => ['FT', 'AET', 'PEN'].includes(f.statusShort))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (finished.length > 0) return finished[0];

  return fixtures[0];
}

export function useFixturePolling(
  leagueId: number,
  fixtureId?: string,
  intervalMs: number = 30000
): UseFixturePollingResult {
  const [fixture, setFixture] = useState<FixtureData | null>(null);
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevScoreRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    try {
      if (fixtureId) {
        const data = await apiFetch(getApiUrl(`/fixtures/${fixtureId}`));
        setFixture(data);
        setFixtures([data]);
      } else {
        // Try today's fixtures first
        let data = await apiFetch(getApiUrl(`/fixtures/today?leagueId=${leagueId}`));
        if (!data || data.length === 0) {
          // Fallback: get all fixtures and pick best
          data = await apiFetch(getApiUrl(`/fixtures?leagueId=${leagueId}&season=2026&limit=500`));
        }
        const allFixtures = Array.isArray(data) ? data : [];
        setFixtures(allFixtures);
        const best = pickBestFixture(allFixtures);
        setFixture(best);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  }, [leagueId, fixtureId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { fixture, fixtures, loading, error };
}

export function useStandingsPolling(
  leagueId: number,
  intervalMs: number = 60000
) {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch(getApiUrl(`/standings?leagueId=${leagueId}&season=2026`));
      setStandings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar classificação');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { standings, loading, error };
}
