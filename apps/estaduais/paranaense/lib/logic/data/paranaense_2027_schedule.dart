import '../models/fixture.dart';
import '../models/team.dart';
import '../models/standing.dart';
import '../../helpers/helpers.dart';

class Paranaense2027Schedule {
  static const int season = 2027;
  static const int leagueId = AppConfig.paranaenseSerieAId; // 606

  // --- GRUPO A ---
  static final Team coritiba = Team(
    id: '132',
    externalId: 132,
    name: 'Coritiba',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/132.png',
  );

  static final Team operarioPr = Team(
    id: '1195',
    externalId: 1195,
    name: 'Operário-PR',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1195.png',
  );

  static final Team cascavel = Team(
    id: '7857',
    externalId: 7857,
    name: 'FC Cascavel',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7857.png',
  );

  static final Team azuriz = Team(
    id: '16104',
    externalId: 16104,
    name: 'Azuriz',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/16104.png',
  );

  static final Team foz = Team(
    id: '1188',
    externalId: 1188,
    name: 'Foz do Iguaçu',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1188.png',
  );

  static final Team paranavai = Team(
    id: '606012',
    externalId: 606012,
    name: 'Paranavaí',
    logo: 'https://wsrv.nl/?url=https%3A%2F%2Fthumb.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F5%2F58%2FACParanava%25C3%25AD.svg%2F330px-ACParanava%25C3%25AD.svg.png',
  );

  // --- GRUPO B ---
  static final Team athleticoPr = Team(
    id: '134',
    externalId: 134,
    name: 'Athletico-PR',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/134.png',
  );

  static final Team maringa = Team(
    id: '1187',
    externalId: 1187,
    name: 'Maringá',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1187.png',
  );

  static final Team londrina = Team(
    id: '144',
    externalId: 144,
    name: 'Londrina',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/144.png',
  );

  static final Team cianorte = Team(
    id: '1186',
    externalId: 1186,
    name: 'Cianorte',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1186.png',
  );

  static final Team parana = Team(
    id: '140',
    externalId: 140,
    name: 'Paraná Clube',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/140.png',
  );

  static final Team saoJoseense = Team(
    id: '18342',
    externalId: 18342,
    name: 'São Joseense',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18342.png',
  );

  static final List<Team> groupATeams = [
    coritiba,
    operarioPr,
    cascavel,
    azuriz,
    foz,
    paranavai,
  ];

  static final List<Team> groupBTeams = [
    athleticoPr,
    maringa,
    londrina,
    cianorte,
    parana,
    saoJoseense,
  ];

  static List<Team> get allTeams => [...groupATeams, ...groupBTeams];

  /// Todas as 36 partidas oficiais da Fase Classificatória (FPF 2027 - 6 Rodadas)
  static List<Fixture> getOfficialFirstPhaseFixtures() {
    final List<Map<String, dynamic>> raw = [
      // 1ª Rodada (Quarta-feira, 06/01/2027 às 20h00 BRT = 23h00 UTC)
      {'ref': 1, 'rod': '1ª Rodada', 'data': '2027-01-06T23:00:00Z', 'home': coritiba, 'away': cianorte, 'estadio': 'Couto Pereira', 'cidade': 'Curitiba'},
      {'ref': 2, 'rod': '1ª Rodada', 'data': '2027-01-06T23:00:00Z', 'home': operarioPr, 'away': maringa, 'estadio': 'Germano Kruger', 'cidade': 'Ponta Grossa'},
      {'ref': 3, 'rod': '1ª Rodada', 'data': '2027-01-06T23:00:00Z', 'home': foz, 'away': londrina, 'estadio': 'Estádio ABC', 'cidade': 'Foz do Iguaçu'},
      {'ref': 4, 'rod': '1ª Rodada', 'data': '2027-01-06T23:00:00Z', 'home': saoJoseense, 'away': cascavel, 'estadio': 'Estádio do Pinhão', 'cidade': 'São José dos Pinhais'},
      {'ref': 5, 'rod': '1ª Rodada', 'data': '2027-01-06T23:00:00Z', 'home': parana, 'away': paranavai, 'estadio': 'Vila Capanema', 'cidade': 'Curitiba'},
      {'ref': 6, 'rod': '1ª Rodada', 'data': '2027-01-06T23:00:00Z', 'home': athleticoPr, 'away': azuriz, 'estadio': 'Arena da Baixada', 'cidade': 'Curitiba'},

      // 2ª Rodada (Sábado, 09/01/2027 às 16h00 BRT = 19h00 UTC)
      {'ref': 7, 'rod': '2ª Rodada', 'data': '2027-01-09T19:00:00Z', 'home': cascavel, 'away': cianorte, 'estadio': 'Estádio Olímpico', 'cidade': 'Cascavel'},
      {'ref': 8, 'rod': '2ª Rodada', 'data': '2027-01-09T19:00:00Z', 'home': maringa, 'away': azuriz, 'estadio': 'Willie Davids', 'cidade': 'Maringá'},
      {'ref': 9, 'rod': '2ª Rodada', 'data': '2027-01-09T19:00:00Z', 'home': londrina, 'away': coritiba, 'estadio': 'VGD', 'cidade': 'Londrina'},
      {'ref': 10, 'rod': '2ª Rodada', 'data': '2027-01-09T19:00:00Z', 'home': parana, 'away': foz, 'estadio': 'Vila Capanema', 'cidade': 'Curitiba'},
      {'ref': 11, 'rod': '2ª Rodada', 'data': '2027-01-09T19:00:00Z', 'home': saoJoseense, 'away': operarioPr, 'estadio': 'Estádio do Pinhão', 'cidade': 'São José dos Pinhais'},
      {'ref': 12, 'rod': '2ª Rodada', 'data': '2027-01-09T19:00:00Z', 'home': athleticoPr, 'away': paranavai, 'estadio': 'Arena da Baixada', 'cidade': 'Curitiba'},

      // 3ª Rodada (Quarta-feira, 13/01/2027 às 20h00 BRT = 23h00 UTC)
      {'ref': 13, 'rod': '3ª Rodada', 'data': '2027-01-13T23:00:00Z', 'home': coritiba, 'away': parana, 'estadio': 'Couto Pereira', 'cidade': 'Curitiba'},
      {'ref': 14, 'rod': '3ª Rodada', 'data': '2027-01-13T23:00:00Z', 'home': paranavai, 'away': maringa, 'estadio': 'Waldemiro Wagner', 'cidade': 'Paranavaí'},
      {'ref': 15, 'rod': '3ª Rodada', 'data': '2027-01-13T23:00:00Z', 'home': cianorte, 'away': operarioPr, 'estadio': 'Albino Turbay', 'cidade': 'Cianorte'},
      {'ref': 16, 'rod': '3ª Rodada', 'data': '2027-01-13T23:00:00Z', 'home': londrina, 'away': cascavel, 'estadio': 'VGD', 'cidade': 'Londrina'},
      {'ref': 17, 'rod': '3ª Rodada', 'data': '2027-01-13T23:00:00Z', 'home': foz, 'away': athleticoPr, 'estadio': 'Estádio ABC', 'cidade': 'Foz do Iguaçu'},
      {'ref': 18, 'rod': '3ª Rodada', 'data': '2027-01-13T23:00:00Z', 'home': azuriz, 'away': saoJoseense, 'estadio': 'Os Pioneiros', 'cidade': 'Pato Branco'},

      // 4ª Rodada (Sábado, 16/01/2027 às 16h00 BRT = 19h00 UTC)
      {'ref': 19, 'rod': '4ª Rodada', 'data': '2027-01-16T19:00:00Z', 'home': paranavai, 'away': saoJoseense, 'estadio': 'Waldemiro Wagner', 'cidade': 'Paranavaí'},
      {'ref': 20, 'rod': '4ª Rodada', 'data': '2027-01-16T19:00:00Z', 'home': operarioPr, 'away': londrina, 'estadio': 'Germano Kruger', 'cidade': 'Ponta Grossa'},
      {'ref': 21, 'rod': '4ª Rodada', 'data': '2027-01-16T19:00:00Z', 'home': cascavel, 'away': parana, 'estadio': 'Estádio Olímpico', 'cidade': 'Cascavel'},
      {'ref': 22, 'rod': '4ª Rodada', 'data': '2027-01-16T19:00:00Z', 'home': athleticoPr, 'away': coritiba, 'estadio': 'Arena da Baixada', 'cidade': 'Curitiba'},
      {'ref': 23, 'rod': '4ª Rodada', 'data': '2027-01-16T19:00:00Z', 'home': foz, 'away': maringa, 'estadio': 'Estádio ABC', 'cidade': 'Foz do Iguaçu'},
      {'ref': 24, 'rod': '4ª Rodada', 'data': '2027-01-16T19:00:00Z', 'home': azuriz, 'away': cianorte, 'estadio': 'Os Pioneiros', 'cidade': 'Pato Branco'},

      // 5ª Rodada (Quarta-feira, 20/01/2027 às 20h00 BRT = 23h00 UTC)
      {'ref': 25, 'rod': '5ª Rodada', 'data': '2027-01-20T23:00:00Z', 'home': parana, 'away': operarioPr, 'estadio': 'Vila Capanema', 'cidade': 'Curitiba'},
      {'ref': 26, 'rod': '5ª Rodada', 'data': '2027-01-20T23:00:00Z', 'home': cascavel, 'away': athleticoPr, 'estadio': 'Estádio Olímpico', 'cidade': 'Cascavel'},
      {'ref': 27, 'rod': '5ª Rodada', 'data': '2027-01-20T23:00:00Z', 'home': maringa, 'away': coritiba, 'estadio': 'Willie Davids', 'cidade': 'Maringá'},
      {'ref': 28, 'rod': '5ª Rodada', 'data': '2027-01-20T23:00:00Z', 'home': saoJoseense, 'away': foz, 'estadio': 'Estádio do Pinhão', 'cidade': 'São José dos Pinhais'},
      {'ref': 29, 'rod': '5ª Rodada', 'data': '2027-01-20T23:00:00Z', 'home': cianorte, 'away': paranavai, 'estadio': 'Albino Turbay', 'cidade': 'Cianorte'},
      {'ref': 30, 'rod': '5ª Rodada', 'data': '2027-01-20T23:00:00Z', 'home': londrina, 'away': azuriz, 'estadio': 'VGD', 'cidade': 'Londrina'},

      // 6ª Rodada (Sábado, 23/01/2027 às 16h00 BRT = 19h00 UTC)
      {'ref': 31, 'rod': '6ª Rodada', 'data': '2027-01-23T19:00:00Z', 'home': azuriz, 'away': parana, 'estadio': 'Os Pioneiros', 'cidade': 'Pato Branco'},
      {'ref': 32, 'rod': '6ª Rodada', 'data': '2027-01-23T19:00:00Z', 'home': operarioPr, 'away': athleticoPr, 'estadio': 'Germano Kruger', 'cidade': 'Ponta Grossa'},
      {'ref': 33, 'rod': '6ª Rodada', 'data': '2027-01-23T19:00:00Z', 'home': maringa, 'away': cascavel, 'estadio': 'Willie Davids', 'cidade': 'Maringá'},
      {'ref': 34, 'rod': '6ª Rodada', 'data': '2027-01-23T19:00:00Z', 'home': coritiba, 'away': saoJoseense, 'estadio': 'Couto Pereira', 'cidade': 'Curitiba'},
      {'ref': 35, 'rod': '6ª Rodada', 'data': '2027-01-23T19:00:00Z', 'home': cianorte, 'away': foz, 'estadio': 'Albino Turbay', 'cidade': 'Cianorte'},
      {'ref': 36, 'rod': '6ª Rodada', 'data': '2027-01-23T19:00:00Z', 'home': paranavai, 'away': londrina, 'estadio': 'Waldemiro Wagner', 'cidade': 'Paranavaí'},
    ];

    return raw.map((m) {
      final homeT = m['home'] as Team;
      final awayT = m['away'] as Team;
      return Fixture(
        id: 'fpf_2027_${m['ref']}',
        externalId: 202760600 + (m['ref'] as int),
        leagueId: leagueId.toString(),
        season: season,
        date: DateTime.parse(m['data'] as String).toLocal(),
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

  /// Classificação inicial dos Grupos A e B (todos zerados com 0 pontos)
  static List<Standing> getOfficialInitialStandings() {
    final List<Standing> list = [];
    int rankA = 1;
    for (final t in groupATeams) {
      list.add(Standing(
        rank: rankA++,
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
        group: 'Grupo A',
      ));
    }
    int rankB = 1;
    for (final t in groupBTeams) {
      list.add(Standing(
        rank: rankB++,
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
        group: 'Grupo B',
      ));
    }
    return list;
  }
}
