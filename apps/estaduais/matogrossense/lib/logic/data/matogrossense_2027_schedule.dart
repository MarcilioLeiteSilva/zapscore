import '../models/fixture.dart';
import '../models/team.dart';
import '../models/standing.dart';
import '../../helpers/helpers.dart';

class Matogrossense2027Schedule {
  static const int season = 2027;
  static const int leagueId = AppConfig.matogrossenseSerieAId; // 630

  // 10 Clubes Oficiais
  static final Team cuiaba = Team(
    id: '1193',
    externalId: 1193,
    name: 'Cuiabá',
    code: 'CUI',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1193.png',
  );

  static final Team luverdense = Team(
    id: '752',
    externalId: 752,
    name: 'Luverdense',
    code: 'LUV',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/752.png',
  );

  static final Team mixto = Team(
    id: '2215',
    externalId: 2215,
    name: 'Mixto',
    code: 'MIX',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2215.png',
  );

  static final Team operarioVg = Team(
    id: '9999',
    externalId: 9999,
    name: 'Operário-VG',
    code: 'OPV',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/9999.png',
  );

  static final Team uniao = Team(
    id: '7788',
    externalId: 7788,
    name: 'União Rondonópolis',
    code: 'UNI',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7788.png',
  );

  static final Team novaMutum = Team(
    id: '13130',
    externalId: 13130,
    name: 'Nova Mutum',
    code: 'NMU',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/13130.png',
  );

  static final Team sportSinop = Team(
    id: '18273',
    externalId: 18273,
    name: 'Sport Sinop',
    code: 'SSI',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18273.png',
  );

  static final Team chapada = Team(
    id: '26048',
    externalId: 26048,
    name: 'Chapada',
    code: 'CHA',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/26048.png',
  );

  static final Team sinop = Team(
    id: '2214',
    externalId: 2214,
    name: 'Sinop',
    code: 'SIN',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2214.png',
  );

  static final Team cacerense = Team(
    id: '7808',
    externalId: 7808,
    name: 'Cacerense',
    code: 'CAC',
    country: 'Brasil',
    logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7808.png',
  );

  static List<Team> get allTeams => [
    cuiaba,
    luverdense,
    mixto,
    operarioVg,
    uniao,
    novaMutum,
    sportSinop,
    chapada,
    sinop,
    cacerense,
  ];

  static List<Standing> get initialStandings {
    final teams = allTeams;
    return List.generate(teams.length, (i) {
      final t = teams[i];
      return Standing(
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
        form: null,
        description: i < 2 ? 'Semifinal' : i < 6 ? 'Quartas de Final' : i >= 8 ? 'Rebaixamento' : 'Permanência',
      );
    });
  }

  static List<Fixture> get fallbackFixtures {
    final matchesData = [
      // 1ª Rodada
      _m(1, '1ª Rodada', '2027-01-10T21:00:00Z', sportSinop, uniao, 'Gigante do Norte', 'Sinop'),
      _m(2, '1ª Rodada', '2027-01-09T21:00:00Z', mixto, sinop, 'Dutrinha', 'Cuiabá'),
      _m(3, '1ª Rodada', '2027-01-10T20:00:00Z', chapada, cacerense, 'Apolônio de Melo', 'Chapada dos Guimarães'),
      _m(4, '1ª Rodada', '2027-01-09T20:30:00Z', novaMutum, operarioVg, 'Waldir Doilho Wons', 'Nova Mutum'),
      _m(5, '1ª Rodada', '2027-01-10T21:00:00Z', cuiaba, luverdense, 'Arena Pantanal', 'Cuiabá'),

      // 2ª Rodada
      _m(6, '2ª Rodada', '2027-01-13T23:00:00Z', uniao, cuiaba, 'Luthero Lopes', 'Rondonópolis'),
      _m(7, '2ª Rodada', '2027-01-14T23:00:00Z', operarioVg, sportSinop, 'Dito Souza', 'Várzea Grande'),
      _m(8, '2ª Rodada', '2027-01-13T23:00:00Z', luverdense, mixto, 'Passo das Emas', 'Lucas do Rio Verde'),
      _m(9, '2ª Rodada', '2027-01-14T00:00:00Z', sinop, chapada, 'Gigante do Norte', 'Sinop'),
      _m(10, '2ª Rodada', '2027-01-13T23:00:00Z', cacerense, novaMutum, 'Geraldão', 'Cáceres'),

      // 3ª Rodada
      _m(11, '3ª Rodada', '2027-01-17T21:00:00Z', mixto, uniao, 'Dutrinha', 'Cuiabá'),
      _m(12, '3ª Rodada', '2027-01-17T21:00:00Z', cuiaba, novaMutum, 'Arena Pantanal', 'Cuiabá'),
      _m(13, '3ª Rodada', '2027-01-17T21:00:00Z', operarioVg, cacerense, 'Dito Souza', 'Várzea Grande'),
      _m(14, '3ª Rodada', '2027-01-17T21:00:00Z', sinop, luverdense, 'Gigante do Norte', 'Sinop'),
      _m(15, '3ª Rodada', '2027-01-17T21:00:00Z', chapada, sportSinop, 'Apolônio de Melo', 'Chapada dos Guimarães'),

      // 4ª Rodada
      _m(16, '4ª Rodada', '2027-01-20T23:00:00Z', sportSinop, mixto, 'Gigante do Norte', 'Sinop'),
      _m(17, '4ª Rodada', '2027-01-20T23:00:00Z', luverdense, operarioVg, 'Passo das Emas', 'Lucas do Rio Verde'),
      _m(18, '4ª Rodada', '2027-01-20T23:00:00Z', uniao, sinop, 'Luthero Lopes', 'Rondonópolis'),
      _m(19, '4ª Rodada', '2027-01-20T23:00:00Z', cacerense, cuiaba, 'Geraldão', 'Cáceres'),
      _m(20, '4ª Rodada', '2027-01-20T23:00:00Z', novaMutum, chapada, 'Waldir Doilho Wons', 'Nova Mutum'),

      // 5ª Rodada
      _m(21, '5ª Rodada', '2027-01-24T21:00:00Z', operarioVg, cuiaba, 'Dito Souza', 'Várzea Grande'),
      _m(22, '5ª Rodada', '2027-01-24T21:00:00Z', luverdense, cacerense, 'Passo das Emas', 'Lucas do Rio Verde'),
      _m(23, '5ª Rodada', '2027-01-24T21:00:00Z', sportSinop, sinop, 'Gigante do Norte', 'Sinop'),
      _m(24, '5ª Rodada', '2027-01-24T21:00:00Z', chapada, uniao, 'Apolônio de Melo', 'Chapada dos Guimarães'),
      _m(25, '5ª Rodada', '2027-01-24T21:00:00Z', mixto, novaMutum, 'Dutrinha', 'Cuiabá'),

      // 6ª Rodada
      _m(26, '6ª Rodada', '2027-01-31T21:00:00Z', uniao, luverdense, 'Luthero Lopes', 'Rondonópolis'),
      _m(27, '6ª Rodada', '2027-01-31T21:00:00Z', cuiaba, chapada, 'Arena Pantanal', 'Cuiabá'),
      _m(28, '6ª Rodada', '2027-01-31T21:00:00Z', cacerense, mixto, 'Geraldão', 'Cáceres'),
      _m(29, '6ª Rodada', '2027-01-31T21:00:00Z', sinop, operarioVg, 'Gigante do Norte', 'Sinop'),
      _m(30, '6ª Rodada', '2027-01-31T21:00:00Z', novaMutum, sportSinop, 'Waldir Doilho Wons', 'Nova Mutum'),

      // 7ª Rodada
      _m(31, '7ª Rodada', '2027-02-07T21:00:00Z', mixto, chapada, 'Dutrinha', 'Cuiabá'),
      _m(32, '7ª Rodada', '2027-02-07T21:00:00Z', cuiaba, sinop, 'Arena Pantanal', 'Cuiabá'),
      _m(33, '7ª Rodada', '2027-02-07T21:00:00Z', operarioVg, uniao, 'Dito Souza', 'Várzea Grande'),
      _m(34, '7ª Rodada', '2027-02-07T21:00:00Z', luverdense, novaMutum, 'Passo das Emas', 'Lucas do Rio Verde'),
      _m(35, '7ª Rodada', '2027-02-07T21:00:00Z', sportSinop, cacerense, 'Gigante do Norte', 'Sinop'),

      // 8ª Rodada
      _m(36, '8ª Rodada', '2027-02-14T21:00:00Z', mixto, operarioVg, 'Dutrinha', 'Cuiabá'),
      _m(37, '8ª Rodada', '2027-02-14T21:00:00Z', sportSinop, cuiaba, 'Gigante do Norte', 'Sinop'),
      _m(38, '8ª Rodada', '2027-02-14T21:00:00Z', chapada, luverdense, 'Apolônio de Melo', 'Chapada dos Guimarães'),
      _m(39, '8ª Rodada', '2027-02-14T21:00:00Z', novaMutum, uniao, 'Waldir Doilho Wons', 'Nova Mutum'),
      _m(40, '8ª Rodada', '2027-02-14T21:00:00Z', cacerense, sinop, 'Geraldão', 'Cáceres'),

      // 9ª Rodada
      _m(41, '9ª Rodada', '2027-02-17T23:00:00Z', cuiaba, mixto, 'Arena Pantanal', 'Cuiabá'),
      _m(42, '9ª Rodada', '2027-02-17T23:00:00Z', operarioVg, chapada, 'Dito Souza', 'Várzea Grande'),
      _m(43, '9ª Rodada', '2027-02-17T23:00:00Z', luverdense, sportSinop, 'Passo das Emas', 'Lucas do Rio Verde'),
      _m(44, '9ª Rodada', '2027-02-17T23:00:00Z', uniao, cacerense, 'Luthero Lopes', 'Rondonópolis'),
      _m(45, '9ª Rodada', '2027-02-17T23:00:00Z', sinop, novaMutum, 'Gigante do Norte', 'Sinop'),
    ];

    return matchesData;
  }

  static Fixture _m(
    int ref,
    String round,
    String dateStr,
    Team home,
    Team away,
    String venue,
    String city,
  ) {
    return Fixture(
      id: '202763000$ref',
      externalId: 202763000 + ref,
      leagueId: leagueId.toString(),
      season: season,
      date: DateTime.parse(dateStr),
      round: round,
      statusLong: 'Not Started',
      statusShort: 'NS',
      elapsed: null,
      venueName: venue,
      venueCity: city,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeTeam: home,
      awayTeam: away,
      homeGoals: null,
      awayGoals: null,
    );
  }
}
