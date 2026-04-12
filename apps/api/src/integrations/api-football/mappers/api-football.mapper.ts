import { Injectable } from '@nestjs/common';
import { League, Team, Fixture, Standing } from '@prisma/client';

@Injectable()
export class ApiFootballMapper {
  static toLeague(apiLeague: any): Partial<League> {
    return {
      externalId: apiLeague.league.id,
      name: apiLeague.league.name,
      country: apiLeague.country.name,
      logo: apiLeague.league.logo,
      type: apiLeague.league.type,
      season: apiLeague.seasons?.find((s: any) => s.current)?.year || apiLeague.seasons?.[0]?.year,
    };
  }

  static toTeam(apiTeam: any): Partial<Team> {
    return {
      externalId: apiTeam.team.id,
      name: apiTeam.team.name,
      code: apiTeam.team.code,
      country: apiTeam.team.country,
      logo: apiTeam.team.logo,
      founded: apiTeam.team.founded,
      national: apiTeam.team.national,
    };
  }

  static toFixture(apiFixture: any, leagueUuid: string, homeTeamUuid: string, awayTeamUuid: string): Partial<Fixture> {
    return {
      externalId: apiFixture.fixture.id,
      leagueId: leagueUuid,
      season: apiFixture.league.season,
      date: new Date(apiFixture.fixture.date),
      round: apiFixture.league.round,
      statusLong: apiFixture.fixture.status.long,
      statusShort: apiFixture.fixture.status.short,
      elapsed: apiFixture.fixture.status.elapsed,
      venueName: apiFixture.fixture.venue?.name,
      venueCity: apiFixture.fixture.venue?.city,
      homeTeamId: homeTeamUuid,
      awayTeamId: awayTeamUuid,
      homeGoals: apiFixture.goals.home,
      awayGoals: apiFixture.goals.away,
    };
  }

  static toStanding(apiStanding: any, leagueUuid: string, teamUuid: string, season: number): Partial<Standing> {
    return {
      leagueId: leagueUuid,
      teamId: teamUuid,
      season: season,
      rank: apiStanding.rank,
      points: apiStanding.points,
      goalsDiff: apiStanding.goalsDiff,
      played: apiStanding.all.played,
      win: apiStanding.all.win,
      draw: apiStanding.all.draw,
      lose: apiStanding.all.lose,
    };
  }
}
