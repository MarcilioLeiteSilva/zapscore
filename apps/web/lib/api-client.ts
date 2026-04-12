let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Garante que a URL tenha o protocolo para evitar o erro ERR_INVALID_URL
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const response = await fetch(url, {
      ...options,
      next: { revalidate: 60 }, // Cache on Next.js side too
    });
    if (!response.ok) {
       throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    console.error(`Fetch API Error (${url}):`, err);
    throw err;
  }
}

export const ZapScoreApi = {
  getHealth: () => fetchApi('/'),
  getCompetitions: () => fetchApi('/competitions'),
  getFixtures: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams({ limit: '500', ...params }).toString();
    return fetchApi(`/fixtures?${query}`);
  },
  getFixturesToday: (leagueId?: number) => {
    return fetchApi(`/fixtures/today${leagueId ? `?leagueId=${leagueId}` : ''}`);
  },
  getFixtureDetail: (id: string) => {
    return fetchApi(`/fixtures/${id}`);
  },
  getStanding: (leagueId: number, season: number = 2026) => {
    return fetchApi(`/standings?leagueId=${leagueId}&season=${season}`);
  },
  getTeams: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/teams?${query}`);
  },
  getCompetitionDetail: (id: number) => {
    return fetchApi(`/competitions/${id}`);
  },
  getTopScorers: (id: number, season: number = 2026) => {
    return fetchApi(`/competitions/${id}/scorers?season=${season}`);
  },
};
