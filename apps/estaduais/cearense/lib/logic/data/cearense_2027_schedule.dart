import '../models/fixture.dart';
import '../models/team.dart';
import '../models/standing.dart';
import '../../helpers/helpers.dart';

class Cearense2027Schedule {
  static const int season = 2027;
  static const int leagueId = AppConfig.externalLeagueId; // 609

  // Clubes Oficiais do Campeonato Cearense 2027 (FCF)
  static final Team ceara = Team(
    id: '129',
    externalId: 129,
    name: 'Ceará',
    logo: 'https://media.api-sports.io/football/teams/129.png',
  );

  static final Team fortaleza = Team(
    id: '131',
    externalId: 131,
    name: 'Fortaleza',
    logo: 'https://media.api-sports.io/football/teams/131.png',
  );

  static final Team ferroviario = Team(
    id: '125',
    externalId: 125,
    name: 'Ferroviário',
    logo: 'https://media.api-sports.io/football/teams/125.png',
  );

  static final Team floresta = Team(
    id: '1196',
    externalId: 1196,
    name: 'Floresta',
    logo: 'https://media.api-sports.io/football/teams/1196.png',
  );

  static final Team iguatu = Team(
    id: '7858',
    externalId: 7858,
    name: 'Iguatu',
    logo: 'https://media.api-sports.io/football/teams/7858.png',
  );

  static final Team maracana = Team(
    id: '14092',
    externalId: 14092,
    name: 'Maracanã',
    logo: 'https://media.api-sports.io/football/teams/14092.png',
  );

  static final Team horizonte = Team(
    id: '7865',
    externalId: 7865,
    name: 'Horizonte',
    logo: 'https://media.api-sports.io/football/teams/7865.png',
  );

  static final Team icasa = Team(
    id: '7868',
    externalId: 7868,
    name: 'Icasa',
    logo: 'https://media.api-sports.io/football/teams/7868.png',
  );

  static final Team maranguape = Team(
    id: '7873',
    externalId: 7873,
    name: 'Maranguape',
    logo: 'https://media.api-sports.io/football/teams/7873.png',
  );

  static final Team itapipoca = Team(
    id: '7869',
    externalId: 7869,
    name: 'Itapipoca',
    logo: 'https://media.api-sports.io/football/teams/7869.png',
  );

  static List<Team> get allTeams => [
        ceara,
        fortaleza,
        ferroviario,
        floresta,
        iguatu,
        maracana,
        horizonte,
        icasa,
        maranguape,
        itapipoca,
      ];

  /// Gera os 45 jogos oficiais da 1ª Fase publicados na Tabela Detalhada da FCF 2027
  static List<Fixture> getOfficialFirstPhaseFixtures() {
    final List<Map<String, dynamic>> raw = [
      // 1ª Rodada
      {
        'ref': 1, 'rod': '1ª Rodada', 'data': '2027-01-05T19:00:00Z',
        'home': ferroviario, 'away': floresta,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 2, 'rod': '1ª Rodada', 'data': '2027-01-05T20:00:00Z',
        'home': horizonte, 'away': ceara,
        'estadio': 'Domingão', 'cidade': 'Horizonte'
      },
      {
        'ref': 3, 'rod': '1ª Rodada', 'data': '2027-01-06T19:00:00Z',
        'home': fortaleza, 'away': itapipoca,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 4, 'rod': '1ª Rodada', 'data': '2027-01-06T16:00:00Z',
        'home': maracana, 'away': iguatu,
        'estadio': 'Almir Dutra', 'cidade': 'Maracanaú'
      },
      {
        'ref': 5, 'rod': '1ª Rodada', 'data': '2027-01-06T20:00:00Z',
        'home': icasa, 'away': maranguape,
        'estadio': 'Romeirão', 'cidade': 'Juazeiro do Norte'
      },

      // 2ª Rodada
      {
        'ref': 6, 'rod': '2ª Rodada', 'data': '2027-01-09T16:30:00Z',
        'home': floresta, 'away': fortaleza,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 7, 'rod': '2ª Rodada', 'data': '2027-01-09T16:00:00Z',
        'home': maranguape, 'away': horizonte,
        'estadio': 'Moraisão', 'cidade': 'Maranguape'
      },
      {
        'ref': 8, 'rod': '2ª Rodada', 'data': '2027-01-10T16:00:00Z',
        'home': ceara, 'away': maracana,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 9, 'rod': '2ª Rodada', 'data': '2027-01-10T16:00:00Z',
        'home': iguatu, 'away': icasa,
        'estadio': 'Morenão', 'cidade': 'Iguatu'
      },
      {
        'ref': 10, 'rod': '2ª Rodada', 'data': '2027-01-10T16:00:00Z',
        'home': itapipoca, 'away': ferroviario,
        'estadio': 'Perilão', 'cidade': 'Itapipoca'
      },

      // 3ª Rodada
      {
        'ref': 11, 'rod': '3ª Rodada', 'data': '2027-01-12T20:00:00Z',
        'home': fortaleza, 'away': maranguape,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 12, 'rod': '3ª Rodada', 'data': '2027-01-13T19:00:00Z',
        'home': ferroviario, 'away': icasa,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 13, 'rod': '3ª Rodada', 'data': '2027-01-13T20:00:00Z',
        'home': iguatu, 'away': ceara,
        'estadio': 'Morenão', 'cidade': 'Iguatu'
      },
      {
        'ref': 14, 'rod': '3ª Rodada', 'data': '2027-01-13T16:00:00Z',
        'home': maracana, 'away': itapipoca,
        'estadio': 'Almir Dutra', 'cidade': 'Maracanaú'
      },
      {
        'ref': 15, 'rod': '3ª Rodada', 'data': '2027-01-14T20:00:00Z',
        'home': floresta, 'away': horizonte,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },

      // 4ª Rodada
      {
        'ref': 16, 'rod': '4ª Rodada', 'data': '2027-01-16T16:30:00Z',
        'home': ceara, 'away': ferroviario,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 17, 'rod': '4ª Rodada', 'data': '2027-01-16T16:00:00Z',
        'home': maranguape, 'away': itapipoca,
        'estadio': 'Moraisão', 'cidade': 'Maranguape'
      },
      {
        'ref': 18, 'rod': '4ª Rodada', 'data': '2027-01-17T16:00:00Z',
        'home': floresta, 'away': maracana,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 19, 'rod': '4ª Rodada', 'data': '2027-01-17T16:00:00Z',
        'home': horizonte, 'away': iguatu,
        'estadio': 'Domingão', 'cidade': 'Horizonte'
      },
      {
        'ref': 20, 'rod': '4ª Rodada', 'data': '2027-01-17T17:00:00Z',
        'home': icasa, 'away': fortaleza,
        'estadio': 'Romeirão', 'cidade': 'Juazeiro do Norte'
      },

      // 5ª Rodada
      {
        'ref': 21, 'rod': '5ª Rodada', 'data': '2027-01-20T20:00:00Z',
        'home': ceara, 'away': maranguape,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 22, 'rod': '5ª Rodada', 'data': '2027-01-20T19:00:00Z',
        'home': maracana, 'away': ferroviario,
        'estadio': 'Almir Dutra', 'cidade': 'Maracanaú'
      },
      {
        'ref': 23, 'rod': '5ª Rodada', 'data': '2027-01-20T16:00:00Z',
        'home': itapipoca, 'away': floresta,
        'estadio': 'Perilão', 'cidade': 'Itapipoca'
      },
      {
        'ref': 24, 'rod': '5ª Rodada', 'data': '2027-01-20T20:00:00Z',
        'home': icasa, 'away': horizonte,
        'estadio': 'Romeirão', 'cidade': 'Juazeiro do Norte'
      },
      {
        'ref': 25, 'rod': '5ª Rodada', 'data': '2027-01-21T20:00:00Z',
        'home': fortaleza, 'away': iguatu,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },

      // 6ª Rodada
      {
        'ref': 26, 'rod': '6ª Rodada', 'data': '2027-01-23T16:30:00Z',
        'home': ceara, 'away': icasa,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 27, 'rod': '6ª Rodada', 'data': '2027-01-23T16:00:00Z',
        'home': maranguape, 'away': floresta,
        'estadio': 'Moraisão', 'cidade': 'Maranguape'
      },
      {
        'ref': 28, 'rod': '6ª Rodada', 'data': '2027-01-24T16:00:00Z',
        'home': ferroviario, 'away': fortaleza,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 29, 'rod': '6ª Rodada', 'data': '2027-01-24T16:00:00Z',
        'home': iguatu, 'away': itapipoca,
        'estadio': 'Morenão', 'cidade': 'Iguatu'
      },
      {
        'ref': 30, 'rod': '6ª Rodada', 'data': '2027-01-24T16:00:00Z',
        'home': horizonte, 'away': maracana,
        'estadio': 'Domingão', 'cidade': 'Horizonte'
      },

      // 7ª Rodada
      {
        'ref': 31, 'rod': '7ª Rodada', 'data': '2027-01-30T16:00:00Z',
        'home': ferroviario, 'away': maranguape,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 32, 'rod': '7ª Rodada', 'data': '2027-01-30T16:00:00Z',
        'home': maracana, 'away': icasa,
        'estadio': 'Almir Dutra', 'cidade': 'Maracanaú'
      },
      {
        'ref': 33, 'rod': '7ª Rodada', 'data': '2027-01-31T18:00:00Z',
        'home': fortaleza, 'away': ceara,
        'estadio': 'Arena Castelão', 'cidade': 'Fortaleza'
      },
      {
        'ref': 34, 'rod': '7ª Rodada', 'data': '2027-01-31T16:00:00Z',
        'home': floresta, 'away': iguatu,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 35, 'rod': '7ª Rodada', 'data': '2027-01-31T16:00:00Z',
        'home': itapipoca, 'away': horizonte,
        'estadio': 'Perilão', 'cidade': 'Itapipoca'
      },

      // 8ª Rodada
      {
        'ref': 36, 'rod': '8ª Rodada', 'data': '2027-02-06T16:30:00Z',
        'home': ceara, 'away': floresta,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 37, 'rod': '8ª Rodada', 'data': '2027-02-06T17:00:00Z',
        'home': icasa, 'away': itapipoca,
        'estadio': 'Romeirão', 'cidade': 'Juazeiro do Norte'
      },
      {
        'ref': 38, 'rod': '8ª Rodada', 'data': '2027-02-07T16:00:00Z',
        'home': fortaleza, 'away': maracana,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 39, 'rod': '8ª Rodada', 'data': '2027-02-07T16:00:00Z',
        'home': maranguape, 'away': iguatu,
        'estadio': 'Moraisão', 'cidade': 'Maranguape'
      },
      {
        'ref': 40, 'rod': '8ª Rodada', 'data': '2027-02-08T20:00:00Z',
        'home': ferroviario, 'away': horizonte,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },

      // 9ª Rodada
      {
        'ref': 41, 'rod': '9ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': floresta, 'away': icasa,
        'estadio': 'Presidente Vargas', 'cidade': 'Fortaleza'
      },
      {
        'ref': 42, 'rod': '9ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': iguatu, 'away': ferroviario,
        'estadio': 'Morenão', 'cidade': 'Iguatu'
      },
      {
        'ref': 43, 'rod': '9ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': horizonte, 'away': fortaleza,
        'estadio': 'Domingão', 'cidade': 'Horizonte'
      },
      {
        'ref': 44, 'rod': '9ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': maracana, 'away': maranguape,
        'estadio': 'Almir Dutra', 'cidade': 'Maracanaú'
      },
      {
        'ref': 45, 'rod': '9ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': itapipoca, 'away': ceara,
        'estadio': 'Perilão', 'cidade': 'Itapipoca'
      },
    ];

    return raw.map((m) {
      final homeT = m['home'] as Team;
      final awayT = m['away'] as Team;
      return Fixture(
        id: 'fcf_2027_${m['ref']}',
        externalId: 2027000 + (m['ref'] as int),
        leagueId: leagueId.toString(),
        season: season,
        date: DateTime.parse(m['data'] as String),
        round: m['rod'] as String,
        statusLong: 'Not Started',
        statusShort: 'NS',
        venueName: m['estadio'] as String,
        venueCity: m['cidade'] as String,
        homeTeamId: homeT.id,
        awayTeamId: awayT.id,
        homeTeam: homeT,
        awayTeam: awayT,
      );
    }).toList();
  }

  /// Classificação inicial do Grupo Único (todos com 0 pontos)
  static List<Standing> getOfficialInitialStandings() {
    int rank = 1;
    return allTeams.map((t) {
      return Standing(
        rank: rank++,
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
        group: 'Grupo Único',
      );
    }).toList();
  }
}
