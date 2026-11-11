import '../models/fixture.dart';
import '../models/team.dart';
import '../models/standing.dart';
import '../../helpers/helpers.dart';

class Sulmatogrossense2027Schedule {
  static const int season = 2027;
  static const int leagueId = AppConfig.externalLeagueId; // 623

  // Clubes Oficiais do Campeonato Sul-Mato-Grossense Série A 2027 (FFMS)
  static final Team operario = Team(
    id: '2217',
    externalId: 2217,
    name: 'Operário-MS',
    logo: 'https://media.api-sports.io/football/teams/2217.png',
  );

  static final Team corumbaense = Team(
    id: '1206',
    externalId: 1206,
    name: 'Corumbaense',
    logo: 'https://media.api-sports.io/football/teams/1206.png',
  );

  static final Team dourados = Team(
    id: '16480',
    externalId: 16480,
    name: 'Dourados',
    logo: 'https://media.api-sports.io/football/teams/16480.png',
  );

  static final Team ivinhema = Team(
    id: '10687',
    externalId: 10687,
    name: 'Ivinhema',
    logo: 'https://media.api-sports.io/football/teams/10687.png',
  );

  static final Team naviraiense = Team(
    id: '18365',
    externalId: 18365,
    name: 'Naviraiense',
    logo: 'https://media.api-sports.io/football/teams/18365.png',
  );

  static final Team pantanal = Team(
    id: '22828',
    externalId: 22828,
    name: 'Pantanal',
    logo: 'https://media.api-sports.io/football/teams/22828.png',
  );

  static final Team bataguassu = Team(
    id: '27285',
    externalId: 27285,
    name: 'Bataguassu',
    logo: 'https://media.api-sports.io/football/teams/27285.png',
  );

  static final Team cra = Team(
    id: '27286',
    externalId: 27286,
    name: 'CR Aquidauana',
    logo: 'https://media.api-sports.io/football/teams/27286.png',
  );

  static final Team comercial = Team(
    id: '7855',
    externalId: 7855,
    name: 'Comercial-MS',
    logo: 'https://media.api-sports.io/football/teams/7855.png',
  );

  static final Team misto = Team(
    id: '27291',
    externalId: 27291,
    name: 'Misto-MS',
    logo: 'https://media.api-sports.io/football/teams/27291.png',
  );

  static List<Team> get allTeams => [
        operario,
        corumbaense,
        dourados,
        ivinhema,
        naviraiense,
        pantanal,
        bataguassu,
        cra,
        comercial,
        misto,
      ];

  /// Gera os 45 jogos oficiais da 1ª Fase publicados na Tabela Básica da FFMS 2027
  static List<Fixture> getOfficialFirstPhaseFixtures() {
    final List<Map<String, dynamic>> raw = [
      // 1ª Rodada (16 e 17 de Janeiro de 2027)
      {
        'ref': 1, 'rod': '1ª Rodada', 'data': '2027-01-16T19:00:00Z',
        'home': misto, 'away': bataguassu,
        'estadio': 'Madrugadão', 'cidade': 'Três Lagoas'
      },
      {
        'ref': 2, 'rod': '1ª Rodada', 'data': '2027-01-16T20:00:00Z',
        'home': cra, 'away': dourados,
        'estadio': 'Noroeste', 'cidade': 'Aquidauana'
      },
      {
        'ref': 3, 'rod': '1ª Rodada', 'data': '2027-01-17T20:00:00Z',
        'home': comercial, 'away': operario,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 4, 'rod': '1ª Rodada', 'data': '2027-01-17T21:00:00Z',
        'home': naviraiense, 'away': corumbaense,
        'estadio': 'Virotão', 'cidade': 'Naviraí'
      },
      {
        'ref': 5, 'rod': '1ª Rodada', 'data': '2027-01-17T21:00:00Z',
        'home': ivinhema, 'away': pantanal,
        'estadio': 'Saraivão', 'cidade': 'Ivinhema'
      },

      // 2ª Rodada (20 e 21 de Janeiro de 2027)
      {
        'ref': 6, 'rod': '2ª Rodada', 'data': '2027-01-20T23:30:00Z',
        'home': bataguassu, 'away': cra,
        'estadio': 'Pereirão', 'cidade': 'Bataguassu'
      },
      {
        'ref': 7, 'rod': '2ª Rodada', 'data': '2027-01-20T19:00:00Z',
        'home': dourados, 'away': comercial,
        'estadio': 'Douradão', 'cidade': 'Dourados'
      },
      {
        'ref': 8, 'rod': '2ª Rodada', 'data': '2027-01-20T23:30:00Z',
        'home': corumbaense, 'away': ivinhema,
        'estadio': 'Arthur Marinho', 'cidade': 'Corumbá'
      },
      {
        'ref': 9, 'rod': '2ª Rodada', 'data': '2027-01-20T23:30:00Z',
        'home': operario, 'away': naviraiense,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 10, 'rod': '2ª Rodada', 'data': '2027-01-21T23:30:00Z',
        'home': pantanal, 'away': misto,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },

      // 3ª Rodada (23 e 24 de Janeiro de 2027)
      {
        'ref': 11, 'rod': '3ª Rodada', 'data': '2027-01-23T19:00:00Z',
        'home': misto, 'away': corumbaense,
        'estadio': 'Madrugadão', 'cidade': 'Três Lagoas'
      },
      {
        'ref': 12, 'rod': '3ª Rodada', 'data': '2027-01-24T14:00:00Z',
        'home': pantanal, 'away': bataguassu,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 13, 'rod': '3ª Rodada', 'data': '2027-01-24T20:00:00Z',
        'home': comercial, 'away': cra,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 14, 'rod': '3ª Rodada', 'data': '2027-01-24T21:00:00Z',
        'home': naviraiense, 'away': dourados,
        'estadio': 'Virotão', 'cidade': 'Naviraí'
      },
      {
        'ref': 15, 'rod': '3ª Rodada', 'data': '2027-01-24T21:00:00Z',
        'home': ivinhema, 'away': operario,
        'estadio': 'Saraivão', 'cidade': 'Ivinhema'
      },

      // 4ª Rodada (30 e 31 de Janeiro de 2027)
      {
        'ref': 16, 'rod': '4ª Rodada', 'data': '2027-01-30T22:00:00Z',
        'home': bataguassu, 'away': comercial,
        'estadio': 'Pereirão', 'cidade': 'Bataguassu'
      },
      {
        'ref': 17, 'rod': '4ª Rodada', 'data': '2027-01-30T22:00:00Z',
        'home': corumbaense, 'away': pantanal,
        'estadio': 'Arthur Marinho', 'cidade': 'Corumbá'
      },
      {
        'ref': 18, 'rod': '4ª Rodada', 'data': '2027-01-30T20:00:00Z',
        'home': cra, 'away': naviraiense,
        'estadio': 'Noroeste', 'cidade': 'Aquidauana'
      },
      {
        'ref': 19, 'rod': '4ª Rodada', 'data': '2027-01-31T21:00:00Z',
        'home': operario, 'away': misto,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 20, 'rod': '4ª Rodada', 'data': '2027-01-31T19:00:00Z',
        'home': dourados, 'away': ivinhema,
        'estadio': 'Douradão', 'cidade': 'Dourados'
      },

      // 5ª Rodada (6 e 7 de Fevereiro de 2027)
      {
        'ref': 21, 'rod': '5ª Rodada', 'data': '2027-02-06T22:00:00Z',
        'home': corumbaense, 'away': bataguassu,
        'estadio': 'Arthur Marinho', 'cidade': 'Corumbá'
      },
      {
        'ref': 22, 'rod': '5ª Rodada', 'data': '2027-02-06T19:00:00Z',
        'home': misto, 'away': dourados,
        'estadio': 'Madrugadão', 'cidade': 'Três Lagoas'
      },
      {
        'ref': 23, 'rod': '5ª Rodada', 'data': '2027-02-07T21:00:00Z',
        'home': naviraiense, 'away': comercial,
        'estadio': 'Virotão', 'cidade': 'Naviraí'
      },
      {
        'ref': 24, 'rod': '5ª Rodada', 'data': '2027-02-07T14:00:00Z',
        'home': pantanal, 'away': operario,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 25, 'rod': '5ª Rodada', 'data': '2027-02-07T21:00:00Z',
        'home': ivinhema, 'away': cra,
        'estadio': 'Saraivão', 'cidade': 'Ivinhema'
      },

      // 6ª Rodada (13 e 14 de Fevereiro de 2027)
      {
        'ref': 26, 'rod': '6ª Rodada', 'data': '2027-02-13T22:00:00Z',
        'home': bataguassu, 'away': naviraiense,
        'estadio': 'Pereirão', 'cidade': 'Bataguassu'
      },
      {
        'ref': 27, 'rod': '6ª Rodada', 'data': '2027-02-13T20:00:00Z',
        'home': comercial, 'away': ivinhema,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 28, 'rod': '6ª Rodada', 'data': '2027-02-13T20:00:00Z',
        'home': cra, 'away': misto,
        'estadio': 'Noroeste', 'cidade': 'Aquidauana'
      },
      {
        'ref': 29, 'rod': '6ª Rodada', 'data': '2027-02-14T21:00:00Z',
        'home': operario, 'away': corumbaense,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 30, 'rod': '6ª Rodada', 'data': '2027-02-14T19:00:00Z',
        'home': dourados, 'away': pantanal,
        'estadio': 'Douradão', 'cidade': 'Dourados'
      },

      // 7ª Rodada (17 e 18 de Fevereiro de 2027)
      {
        'ref': 31, 'rod': '7ª Rodada', 'data': '2027-02-17T23:30:00Z',
        'home': operario, 'away': bataguassu,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 32, 'rod': '7ª Rodada', 'data': '2027-02-17T23:30:00Z',
        'home': ivinhema, 'away': naviraiense,
        'estadio': 'Saraivão', 'cidade': 'Ivinhema'
      },
      {
        'ref': 33, 'rod': '7ª Rodada', 'data': '2027-02-17T23:30:00Z',
        'home': corumbaense, 'away': dourados,
        'estadio': 'Arthur Marinho', 'cidade': 'Corumbá'
      },
      {
        'ref': 34, 'rod': '7ª Rodada', 'data': '2027-02-17T23:30:00Z',
        'home': misto, 'away': comercial,
        'estadio': 'Madrugadão', 'cidade': 'Três Lagoas'
      },
      {
        'ref': 35, 'rod': '7ª Rodada', 'data': '2027-02-18T23:30:00Z',
        'home': pantanal, 'away': cra,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },

      // 8ª Rodada (20 e 21 de Fevereiro de 2027)
      {
        'ref': 36, 'rod': '8ª Rodada', 'data': '2027-02-20T22:00:00Z',
        'home': bataguassu, 'away': ivinhema,
        'estadio': 'Pereirão', 'cidade': 'Bataguassu'
      },
      {
        'ref': 37, 'rod': '8ª Rodada', 'data': '2027-02-20T20:00:00Z',
        'home': cra, 'away': corumbaense,
        'estadio': 'Noroeste', 'cidade': 'Aquidauana'
      },
      {
        'ref': 38, 'rod': '8ª Rodada', 'data': '2027-02-21T19:00:00Z',
        'home': dourados, 'away': operario,
        'estadio': 'Douradão', 'cidade': 'Dourados'
      },
      {
        'ref': 39, 'rod': '8ª Rodada', 'data': '2027-02-21T21:00:00Z',
        'home': naviraiense, 'away': misto,
        'estadio': 'Virotão', 'cidade': 'Naviraí'
      },
      {
        'ref': 40, 'rod': '8ª Rodada', 'data': '2027-02-21T20:00:00Z',
        'home': comercial, 'away': pantanal,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },

      // 9ª Rodada (24 de Fevereiro de 2027)
      {
        'ref': 41, 'rod': '9ª Rodada', 'data': '2027-02-24T23:30:00Z',
        'home': bataguassu, 'away': dourados,
        'estadio': 'Pereirão', 'cidade': 'Bataguassu'
      },
      {
        'ref': 42, 'rod': '9ª Rodada', 'data': '2027-02-24T23:30:00Z',
        'home': ivinhema, 'away': misto,
        'estadio': 'Saraivão', 'cidade': 'Ivinhema'
      },
      {
        'ref': 43, 'rod': '9ª Rodada', 'data': '2027-02-24T23:30:00Z',
        'home': operario, 'away': cra,
        'estadio': 'Moreninhas', 'cidade': 'Campo Grande'
      },
      {
        'ref': 44, 'rod': '9ª Rodada', 'data': '2027-02-24T23:30:00Z',
        'home': naviraiense, 'away': pantanal,
        'estadio': 'Virotão', 'cidade': 'Naviraí'
      },
      {
        'ref': 45, 'rod': '9ª Rodada', 'data': '2027-02-24T23:30:00Z',
        'home': corumbaense, 'away': comercial,
        'estadio': 'Arthur Marinho', 'cidade': 'Corumbá'
      },
    ];

    return raw.map((m) {
      final homeT = m['home'] as Team;
      final awayT = m['away'] as Team;
      return Fixture(
        id: '2027623${m['ref'].toString().padLeft(2, '0')}',
        externalId: 202762300 + (m['ref'] as int),
        leagueId: AppConfig.leagueId,
        season: 2027,
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

  /// Classificação inicial da 1ª Fase (todos com 0 pontos)
  static List<Standing> getOfficialInitialStandings() {
    int rank = 1;
    return allTeams.map((t) {
      String? desc;
      if (rank <= 2) {
        desc = 'Classificado direto para as Semifinais';
      } else if (rank <= 6) {
        desc = 'Classificado para as Quartas de Final';
      } else if (rank >= 9) {
        desc = 'Rebaixamento para a Série B 2028';
      }
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
        group: '1ª Fase',
        form: '-----',
        description: desc,
      );
    }).toList();
  }
}
