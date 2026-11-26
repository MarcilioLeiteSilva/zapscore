import '../models/fixture.dart';
import '../models/team.dart';
import '../models/standing.dart';
import '../../helpers/helpers.dart';

class Acreano2027Schedule {
  static const int season = 2027;
  static const int leagueId = AppConfig.principalLeagueId; // 520

  // 8 Clubes Oficiais FFAC 2027
  static final Team adesg = Team(
    id: '18391',
    externalId: 18391,
    name: 'ADESG',
    code: 'ADE',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18391.png',
  );

  static final Team atleticoAc = Team(
    id: '7768',
    externalId: 7768,
    name: 'Atlético Acreano',
    code: 'AAC',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7768.png',
  );

  static final Team galvez = Team(
    id: '1228',
    externalId: 1228,
    name: 'Galvez',
    code: 'GAL',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1228.png',
  );

  static final Team humaita = Team(
    id: '10478',
    externalId: 10478,
    name: 'Humaitá',
    code: 'HUM',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10478.png',
  );

  static final Team independencia = Team(
    id: '10853',
    externalId: 10853,
    name: 'Independência',
    code: 'IND',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10853.png',
  );

  static final Team placido = Team(
    id: '7849',
    externalId: 7849,
    name: 'Plácido de Castro',
    code: 'PLA',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7849.png',
  );

  static final Team rioBranco = Team(
    id: '2220',
    externalId: 2220,
    name: 'Rio Branco-AC',
    code: 'RBR',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2220.png',
  );

  static final Team santaCruz = Team(
    id: '27283',
    externalId: 27283,
    name: 'Santa Cruz-AC',
    code: 'STC',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/27283.png',
  );

  static final List<Team> teams = [
    adesg,
    atleticoAc,
    galvez,
    humaita,
    independencia,
    placido,
    rioBranco,
    santaCruz,
  ];

  static List<Standing> get initialStandings {
    final list = <Standing>[];
    for (int i = 0; i < teams.length; i++) {
      final t = teams[i];
      list.add(
        Standing(
          rank: i + 1,
          teamId: t.externalId,
          teamName: t.name,
          teamLogo: t.logo,
          points: 0,
          played: 0,
          win: 0,
          draw: 0,
          lose: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalsDiff: 0,
          group: '1ª Fase',
          form: '-----',
          description: i < 4
              ? 'Classificado para as Semifinais (G-4)'
              : (i >= 6 ? 'Rebaixamento para a Série B (Z-2)' : null),
        ),
      );
    }
    return list;
  }

  static List<Fixture> get fallbackFixtures {
    final list = <Fixture>[];

    void addMatch({
      required int ref,
      required String round,
      required DateTime date,
      required Team home,
      required Team away,
      required String venue,
    }) {
      list.add(
        Fixture(
          id: 'acreano_2027_$ref',
          externalId: 202752000 + ref,
          leagueId: leagueId.toString(),
          season: season,
          date: date,
          round: round,
          statusLong: 'Not Started',
          statusShort: 'NS',
          venueName: venue,
          venueCity: 'Rio Branco',
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeTeam: home,
          awayTeam: away,
        ),
      );
    }

    // 1ª Rodada
    addMatch(ref: 1, round: '1ª Rodada', date: DateTime.parse('2027-01-09T20:30:00Z'), home: santaCruz, away: atleticoAc, venue: 'Estádio Tonicão');
    addMatch(ref: 2, round: '1ª Rodada', date: DateTime.parse('2027-01-09T22:45:00Z'), home: rioBranco, away: placido, venue: 'Estádio Tonicão');
    addMatch(ref: 3, round: '1ª Rodada', date: DateTime.parse('2027-01-10T22:00:00Z'), home: galvez, away: adesg, venue: 'Arena da Floresta');
    addMatch(ref: 12, round: '1ª Rodada', date: DateTime.parse('2027-01-26T23:00:00Z'), home: humaita, away: independencia, venue: 'Estádio Tonicão');

    // 2ª Rodada
    addMatch(ref: 4, round: '2ª Rodada', date: DateTime.parse('2027-01-14T22:00:00Z'), home: independencia, away: atleticoAc, venue: 'Arena da Floresta');
    addMatch(ref: 5, round: '2ª Rodada', date: DateTime.parse('2027-01-15T00:15:00Z'), home: adesg, away: rioBranco, venue: 'Arena da Floresta');
    addMatch(ref: 6, round: '2ª Rodada', date: DateTime.parse('2027-01-16T20:30:00Z'), home: galvez, away: humaita, venue: 'Estádio Tonicão');
    addMatch(ref: 7, round: '2ª Rodada', date: DateTime.parse('2027-01-16T22:45:00Z'), home: santaCruz, away: placido, venue: 'Estádio Tonicão');

    // 3ª Rodada
    addMatch(ref: 8, round: '3ª Rodada', date: DateTime.parse('2027-01-21T22:00:00Z'), home: humaita, away: rioBranco, venue: 'Arena da Floresta');
    addMatch(ref: 9, round: '3ª Rodada', date: DateTime.parse('2027-01-22T00:15:00Z'), home: santaCruz, away: independencia, venue: 'Arena da Floresta');
    addMatch(ref: 10, round: '3ª Rodada', date: DateTime.parse('2027-01-23T20:30:00Z'), home: placido, away: adesg, venue: 'Estádio Tonicão');
    addMatch(ref: 11, round: '3ª Rodada', date: DateTime.parse('2027-01-23T22:45:00Z'), home: atleticoAc, away: galvez, venue: 'Estádio Tonicão');

    // 4ª Rodada
    addMatch(ref: 13, round: '4ª Rodada', date: DateTime.parse('2027-01-30T20:30:00Z'), home: placido, away: humaita, venue: 'Estádio Tonicão');
    addMatch(ref: 14, round: '4ª Rodada', date: DateTime.parse('2027-01-30T22:45:00Z'), home: independencia, away: galvez, venue: 'Estádio Tonicão');
    addMatch(ref: 15, round: '4ª Rodada', date: DateTime.parse('2027-01-31T21:00:00Z'), home: adesg, away: santaCruz, venue: 'Arena da Floresta');
    addMatch(ref: 16, round: '4ª Rodada', date: DateTime.parse('2027-01-31T23:15:00Z'), home: atleticoAc, away: rioBranco, venue: 'Arena da Floresta');

    // 5ª Rodada
    addMatch(ref: 17, round: '5ª Rodada', date: DateTime.parse('2027-02-13T20:30:00Z'), home: rioBranco, away: independencia, venue: 'Estádio Tonicão');
    addMatch(ref: 18, round: '5ª Rodada', date: DateTime.parse('2027-02-13T22:45:00Z'), home: humaita, away: adesg, venue: 'Estádio Tonicão');
    addMatch(ref: 19, round: '5ª Rodada', date: DateTime.parse('2027-02-14T21:00:00Z'), home: atleticoAc, away: placido, venue: 'Arena da Floresta');
    addMatch(ref: 20, round: '5ª Rodada', date: DateTime.parse('2027-02-14T23:15:00Z'), home: galvez, away: santaCruz, venue: 'Arena da Floresta');

    // 6ª Rodada
    addMatch(ref: 21, round: '6ª Rodada', date: DateTime.parse('2027-02-18T22:00:00Z'), home: adesg, away: atleticoAc, venue: 'Arena da Floresta');
    addMatch(ref: 22, round: '6ª Rodada', date: DateTime.parse('2027-02-19T00:15:00Z'), home: independencia, away: placido, venue: 'Arena da Floresta');
    addMatch(ref: 23, round: '6ª Rodada', date: DateTime.parse('2027-02-20T20:30:00Z'), home: rioBranco, away: galvez, venue: 'Estádio Tonicão');
    addMatch(ref: 24, round: '6ª Rodada', date: DateTime.parse('2027-02-20T22:45:00Z'), home: humaita, away: santaCruz, venue: 'Estádio Tonicão');

    // 7ª Rodada
    addMatch(ref: 25, round: '7ª Rodada', date: DateTime.parse('2027-02-25T22:00:00Z'), home: placido, away: galvez, venue: 'Arena da Floresta');
    addMatch(ref: 26, round: '7ª Rodada', date: DateTime.parse('2027-02-26T00:15:00Z'), home: atleticoAc, away: humaita, venue: 'Arena da Floresta');
    addMatch(ref: 27, round: '7ª Rodada', date: DateTime.parse('2027-02-27T20:30:00Z'), home: santaCruz, away: rioBranco, venue: 'Estádio Tonicão');
    addMatch(ref: 28, round: '7ª Rodada', date: DateTime.parse('2027-02-27T22:45:00Z'), home: independencia, away: adesg, venue: 'Estádio Tonicão');

    return list;
  }
}
