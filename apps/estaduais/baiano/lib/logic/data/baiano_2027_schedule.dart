import '../models/fixture.dart';
import '../models/team.dart';
import '../models/standing.dart';
import '../../helpers/helpers.dart';

class Baiano2027Schedule {
  static const int season = 2027;
  static const int leagueId = AppConfig.externalLeagueId; // 602

  // Clubes Oficiais do Campeonato Baiano Série A 2027 (FBF)
  static final Team bahia = Team(
    id: '118',
    externalId: 118,
    name: 'Bahia',
    logo: 'https://media.api-sports.io/football/teams/118.png',
  );

  static final Team vitoria = Team(
    id: '136',
    externalId: 136,
    name: 'Vitória',
    logo: 'https://media.api-sports.io/football/teams/136.png',
  );

  static final Team fluminense = Team(
    id: '1200',
    externalId: 1200,
    name: 'Fluminense de Feira',
    logo: 'https://media.api-sports.io/football/teams/1200.png',
  );

  static final Team juazeirense = Team(
    id: '1224',
    externalId: 1224,
    name: 'Juazeirense',
    logo: 'https://media.api-sports.io/football/teams/1224.png',
  );

  static final Team jacuipense = Team(
    id: '7831',
    externalId: 7831,
    name: 'Jacuipense',
    logo: 'https://media.api-sports.io/football/teams/7831.png',
  );

  static final Team galicia = Team(
    id: '12935',
    externalId: 12935,
    name: 'Galícia',
    logo: 'https://media.api-sports.io/football/teams/12935.png',
  );

  static final Team barcelona = Team(
    id: '15103',
    externalId: 15103,
    name: 'Barcelona BA',
    logo: 'https://media.api-sports.io/football/teams/15103.png',
  );

  static final Team jequie = Team(
    id: '15104',
    externalId: 15104,
    name: 'Jequié',
    logo: 'https://media.api-sports.io/football/teams/15104.png',
  );

  static final Team porto = Team(
    id: '23591',
    externalId: 23591,
    name: 'Porto Sport Club',
    logo: 'https://media.api-sports.io/football/teams/23591.png',
  );

  static final Team ssa = Team(
    id: '23592',
    externalId: 23592,
    name: 'SSA FC',
    logo: 'https://media.api-sports.io/football/teams/23592.png',
  );

  static List<Team> get allTeams => [
        bahia,
        vitoria,
        fluminense,
        juazeirense,
        jacuipense,
        galicia,
        barcelona,
        jequie,
        porto,
        ssa,
      ];

  /// Gera os 45 jogos oficiais da 1ª Fase publicados na Tabela Básica da FBF 2027
  static List<Fixture> getOfficialFirstPhaseFixtures() {
    final List<Map<String, dynamic>> raw = [
      // 1ª Rodada
      {
        'ref': 1, 'rod': '1ª Rodada', 'data': '2027-01-09T16:00:00Z',
        'home': fluminense, 'away': juazeirense,
        'estadio': 'Joia da Princesa', 'cidade': 'Feira de Santana'
      },
      {
        'ref': 2, 'rod': '1ª Rodada', 'data': '2027-01-09T18:30:00Z',
        'home': bahia, 'away': ssa,
        'estadio': 'Arena Fonte Nova', 'cidade': 'Salvador'
      },
      {
        'ref': 3, 'rod': '1ª Rodada', 'data': '2027-01-10T16:00:00Z',
        'home': jequie, 'away': galicia,
        'estadio': 'Waldomiro Borges', 'cidade': 'Jequié'
      },
      {
        'ref': 4, 'rod': '1ª Rodada', 'data': '2027-01-10T16:00:00Z',
        'home': porto, 'away': jacuipense,
        'estadio': 'Agnaldo Bento', 'cidade': 'Porto Seguro'
      },
      {
        'ref': 5, 'rod': '1ª Rodada', 'data': '2027-01-10T18:30:00Z',
        'home': vitoria, 'away': barcelona,
        'estadio': 'Barradão', 'cidade': 'Salvador'
      },

      // 2ª Rodada
      {
        'ref': 6, 'rod': '2ª Rodada', 'data': '2027-01-13T19:00:00Z',
        'home': barcelona, 'away': jequie,
        'estadio': 'Mário Pessoa', 'cidade': 'Ilhéus'
      },
      {
        'ref': 7, 'rod': '2ª Rodada', 'data': '2027-01-13T21:30:00Z',
        'home': jacuipense, 'away': bahia,
        'estadio': 'Valfredão', 'cidade': 'Riachão do Jacuípe'
      },
      {
        'ref': 8, 'rod': '2ª Rodada', 'data': '2027-01-14T19:00:00Z',
        'home': juazeirense, 'away': vitoria,
        'estadio': 'Adauto Moraes', 'cidade': 'Juazeiro'
      },
      {
        'ref': 9, 'rod': '2ª Rodada', 'data': '2027-01-14T16:00:00Z',
        'home': ssa, 'away': fluminense,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },
      {
        'ref': 10, 'rod': '2ª Rodada', 'data': '2027-01-14T20:00:00Z',
        'home': galicia, 'away': porto,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },

      // 3ª Rodada
      {
        'ref': 11, 'rod': '3ª Rodada', 'data': '2027-01-16T16:00:00Z',
        'home': fluminense, 'away': galicia,
        'estadio': 'Joia da Princesa', 'cidade': 'Feira de Santana'
      },
      {
        'ref': 12, 'rod': '3ª Rodada', 'data': '2027-01-16T18:30:00Z',
        'home': jacuipense, 'away': ssa,
        'estadio': 'Valfredão', 'cidade': 'Riachão do Jacuípe'
      },
      {
        'ref': 13, 'rod': '3ª Rodada', 'data': '2027-01-17T16:00:00Z',
        'home': jequie, 'away': bahia,
        'estadio': 'Waldomiro Borges', 'cidade': 'Jequié'
      },
      {
        'ref': 14, 'rod': '3ª Rodada', 'data': '2027-01-17T16:00:00Z',
        'home': juazeirense, 'away': barcelona,
        'estadio': 'Adauto Moraes', 'cidade': 'Juazeiro'
      },
      {
        'ref': 15, 'rod': '3ª Rodada', 'data': '2027-01-17T18:30:00Z',
        'home': vitoria, 'away': porto,
        'estadio': 'Barradão', 'cidade': 'Salvador'
      },

      // 4ª Rodada
      {
        'ref': 16, 'rod': '4ª Rodada', 'data': '2027-01-20T19:00:00Z',
        'home': bahia, 'away': juazeirense,
        'estadio': 'Arena Fonte Nova', 'cidade': 'Salvador'
      },
      {
        'ref': 17, 'rod': '4ª Rodada', 'data': '2027-01-20T19:00:00Z',
        'home': jequie, 'away': ssa,
        'estadio': 'Waldomiro Borges', 'cidade': 'Jequié'
      },
      {
        'ref': 18, 'rod': '4ª Rodada', 'data': '2027-01-21T16:00:00Z',
        'home': porto, 'away': fluminense,
        'estadio': 'Agnaldo Bento', 'cidade': 'Porto Seguro'
      },
      {
        'ref': 19, 'rod': '4ª Rodada', 'data': '2027-01-21T19:00:00Z',
        'home': galicia, 'away': barcelona,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },
      {
        'ref': 20, 'rod': '4ª Rodada', 'data': '2027-01-21T21:30:00Z',
        'home': vitoria, 'away': jacuipense,
        'estadio': 'Barradão', 'cidade': 'Salvador'
      },

      // 5ª Rodada
      {
        'ref': 21, 'rod': '5ª Rodada', 'data': '2027-01-23T16:00:00Z',
        'home': fluminense, 'away': jequie,
        'estadio': 'Joia da Princesa', 'cidade': 'Feira de Santana'
      },
      {
        'ref': 22, 'rod': '5ª Rodada', 'data': '2027-01-24T16:00:00Z',
        'home': bahia, 'away': vitoria,
        'estadio': 'Arena Fonte Nova', 'cidade': 'Salvador'
      },
      {
        'ref': 23, 'rod': '5ª Rodada', 'data': '2027-01-24T16:00:00Z',
        'home': barcelona, 'away': porto,
        'estadio': 'Mário Pessoa', 'cidade': 'Ilhéus'
      },
      {
        'ref': 24, 'rod': '5ª Rodada', 'data': '2027-01-24T18:30:00Z',
        'home': jacuipense, 'away': juazeirense,
        'estadio': 'Valfredão', 'cidade': 'Riachão do Jacuípe'
      },
      {
        'ref': 25, 'rod': '5ª Rodada', 'data': '2027-01-24T18:30:00Z',
        'home': ssa, 'away': galicia,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },

      // 6ª Rodada
      {
        'ref': 26, 'rod': '6ª Rodada', 'data': '2027-01-30T16:00:00Z',
        'home': barcelona, 'away': fluminense,
        'estadio': 'Mário Pessoa', 'cidade': 'Ilhéus'
      },
      {
        'ref': 27, 'rod': '6ª Rodada', 'data': '2027-01-31T16:00:00Z',
        'home': porto, 'away': bahia,
        'estadio': 'Agnaldo Bento', 'cidade': 'Porto Seguro'
      },
      {
        'ref': 28, 'rod': '6ª Rodada', 'data': '2027-01-31T16:00:00Z',
        'home': juazeirense, 'away': ssa,
        'estadio': 'Adauto Moraes', 'cidade': 'Juazeiro'
      },
      {
        'ref': 29, 'rod': '6ª Rodada', 'data': '2027-01-31T18:30:00Z',
        'home': galicia, 'away': jacuipense,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },
      {
        'ref': 30, 'rod': '6ª Rodada', 'data': '2027-01-31T18:30:00Z',
        'home': vitoria, 'away': jequie,
        'estadio': 'Barradão', 'cidade': 'Salvador'
      },

      // 7ª Rodada
      {
        'ref': 31, 'rod': '7ª Rodada', 'data': '2027-02-06T16:00:00Z',
        'home': fluminense, 'away': vitoria,
        'estadio': 'Joia da Princesa', 'cidade': 'Feira de Santana'
      },
      {
        'ref': 32, 'rod': '7ª Rodada', 'data': '2027-02-07T16:00:00Z',
        'home': bahia, 'away': galicia,
        'estadio': 'Arena Fonte Nova', 'cidade': 'Salvador'
      },
      {
        'ref': 33, 'rod': '7ª Rodada', 'data': '2027-02-07T16:00:00Z',
        'home': jacuipense, 'away': barcelona,
        'estadio': 'Valfredão', 'cidade': 'Riachão do Jacuípe'
      },
      {
        'ref': 34, 'rod': '7ª Rodada', 'data': '2027-02-07T18:30:00Z',
        'home': jequie, 'away': juazeirense,
        'estadio': 'Waldomiro Borges', 'cidade': 'Jequié'
      },
      {
        'ref': 35, 'rod': '7ª Rodada', 'data': '2027-02-07T18:30:00Z',
        'home': ssa, 'away': porto,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },

      // 8ª Rodada
      {
        'ref': 36, 'rod': '8ª Rodada', 'data': '2027-02-13T16:00:00Z',
        'home': barcelona, 'away': bahia,
        'estadio': 'Mário Pessoa', 'cidade': 'Ilhéus'
      },
      {
        'ref': 37, 'rod': '8ª Rodada', 'data': '2027-02-13T18:30:00Z',
        'home': jacuipense, 'away': fluminense,
        'estadio': 'Valfredão', 'cidade': 'Riachão do Jacuípe'
      },
      {
        'ref': 38, 'rod': '8ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': porto, 'away': jequie,
        'estadio': 'Agnaldo Bento', 'cidade': 'Porto Seguro'
      },
      {
        'ref': 39, 'rod': '8ª Rodada', 'data': '2027-02-14T16:00:00Z',
        'home': juazeirense, 'away': galicia,
        'estadio': 'Adauto Moraes', 'cidade': 'Juazeiro'
      },
      {
        'ref': 40, 'rod': '8ª Rodada', 'data': '2027-02-14T18:30:00Z',
        'home': vitoria, 'away': ssa,
        'estadio': 'Barradão', 'cidade': 'Salvador'
      },

      // 9ª Rodada (Horário Uniforme)
      {
        'ref': 41, 'rod': '9ª Rodada', 'data': '2027-02-21T16:00:00Z',
        'home': bahia, 'away': fluminense,
        'estadio': 'Arena Fonte Nova', 'cidade': 'Salvador'
      },
      {
        'ref': 42, 'rod': '9ª Rodada', 'data': '2027-02-21T16:00:00Z',
        'home': jequie, 'away': jacuipense,
        'estadio': 'Waldomiro Borges', 'cidade': 'Jequié'
      },
      {
        'ref': 43, 'rod': '9ª Rodada', 'data': '2027-02-21T16:00:00Z',
        'home': juazeirense, 'away': porto,
        'estadio': 'Adauto Moraes', 'cidade': 'Juazeiro'
      },
      {
        'ref': 44, 'rod': '9ª Rodada', 'data': '2027-02-21T16:00:00Z',
        'home': ssa, 'away': barcelona,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },
      {
        'ref': 45, 'rod': '9ª Rodada', 'data': '2027-02-21T16:00:00Z',
        'home': galicia, 'away': vitoria,
        'estadio': 'Pituaçu', 'cidade': 'Salvador'
      },
    ];

    return raw.map((m) {
      final homeT = m['home'] as Team;
      final awayT = m['away'] as Team;
      return Fixture(
        id: 'fbf_2027_${m['ref']}',
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

