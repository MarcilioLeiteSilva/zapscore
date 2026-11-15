import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
import '../models/team.dart';
import 'standings_engine.dart';
import 'bracket_engine.dart';

class CompetitionNormalizer {
  /// Normaliza dados brutos de API em uma estrutura completa e tipada de Competition
  static Competition normalize({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    if (leagueId == 522) {
      return _buildAmazonense2027(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    }

    // Genérico para outros campeonatos
    return _buildGenericCompetition(
      leagueId: leagueId,
      leagueName: leagueName,
      leagueLogo: leagueLogo,
      season: season,
      rawStandings: rawStandings,
      rawFixtures: rawFixtures,
    );
  }

  static List<Fixture> get canonicalAmazonenseFixtures {
    final comp = _buildAmazonense2027(
      leagueId: 522,
      leagueName: 'Campeonato Amazonense',
      season: 2027,
      rawStandings: const [],
      rawFixtures: const [],
    );
    return comp.phases.first.fixtures;
  }

  static List<Standing> get canonicalAmazonenseStandings {
    final comp = _buildAmazonense2027(
      leagueId: 522,
      leagueName: 'Campeonato Amazonense',
      season: 2027,
      rawStandings: const [],
      rawFixtures: const [],
    );
    return comp.phases.first.standings;
  }

  // =========================================================================
  // --- 🏆 BAREZÃO SÉRIE A 2027 (ID 522) ---
  // =========================================================================
  // 1ª Fase (8 clubes em turno único, 7 rodadas, 28 jogos)
  // 2ª Fase (Playoffs de Quartas - Ida e Volta: 3º x 6º e 4º x 5º)
  // 3ª Fase (Semifinais - Ida e Volta: 1º x Venc. P2 e 2º x Venc. P1)
  // 4ª Fase (Grande Final - Jogo Único)
  static Competition _buildAmazonense2027({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 8 Clubes Oficiais FAF 2027 (Escudos Oficiais FAF / oGol / Wikipedia)
    final teamNacional = Team(
      id: 'nacional',
      externalId: 7578,
      name: 'Nacional-AM',
      logo: 'https://upload.wikimedia.org/wikipedia/pt/a/af/Nacional_FC_Amazonas_2021.png',
      country: 'Brasil',
    );
    final teamAmazonas = Team(
      id: 'amazonas',
      externalId: 15383,
      name: 'Amazonas FC',
      logo: 'https://cdn-img.staticzz.com/img/logos/equipas/210178_imgbank_1711024367.png',
      country: 'Brasil',
    );
    final teamManaus = Team(
      id: 'manaus',
      externalId: 7566,
      name: 'Manaus FC',
      logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a3/Escudo_do_Manaus_Futebol_Clube.png',
      country: 'Brasil',
    );
    final teamManauara = Team(
      id: 'manauara',
      externalId: 18768,
      name: 'Manauara EC',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Manauara_EC-AM_%28BRA%29_logo.png',
      country: 'Brasil',
    );
    final teamPrincesa = Team(
      id: 'princesa',
      externalId: 7579,
      name: 'Princesa do Solimões',
      logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3513_imgbank.png',
      country: 'Brasil',
    );
    final teamParintins = Team(
      id: 'parintins',
      externalId: 20120,
      name: 'RPE Parintins',
      logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f9/ParintinsFC.png',
      country: 'Brasil',
    );
    final teamItacoatiara = Team(
      id: 'itacoatiara',
      externalId: 243643,
      name: 'Itacoatiara FC',
      logo: 'https://cdn-img.staticzz.com/img/logos/equipas/243643_imgbank_1784021108.png',
      country: 'Brasil',
    );
    final teamFast = Team(
      id: 'fast',
      externalId: 7559,
      name: 'Fast Clube',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Fast_Clube.png',
      country: 'Brasil',
    );

    // -------------------------------------------------------------
    // 1. 1ª Fase Classificatória (Turno Único, 7 Rodadas, 28 Jogos)
    // -------------------------------------------------------------
    List<Fixture> firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      final isKnockout = r.contains('semi') ||
          r.contains('final') ||
          r.contains('quarter') ||
          r.contains('playoff') ||
          r.contains('play-off') ||
          r.contains('play off') ||
          r.contains('quartas');
      return !isKnockout;
    }).toList();

    Fixture makeFix(String id, int extId, DateTime date, String round, Team home, Team away, String venue) {
      return Fixture(
        id: id,
        externalId: extId,
        leagueId: '522',
        season: 2027,
        homeTeamId: '${home.externalId}',
        awayTeamId: '${away.externalId}',
        date: date,
        round: round,
        statusShort: 'NS',
        statusLong: 'Não Iniciado',
        homeTeam: home,
        awayTeam: away,
        venueName: venue,
      );
    }

    // Se o backend ainda não tiver as 28 partidas, injeta a tabela oficial FAF 2027
    if (firstPhaseFixtures.isEmpty) {
      firstPhaseFixtures = [
        // 1ª Rodada (9 e 10 de Janeiro)
        makeFix('52201', 52201, DateTime.utc(2027, 1, 9, 19, 30), '1ª Rodada', teamNacional, teamFast, 'Arena da Amazônia'),
        makeFix('52202', 52202, DateTime.utc(2027, 1, 9, 19, 30), '1ª Rodada', teamAmazonas, teamItacoatiara, 'Estádio Carlos Zamith'),
        makeFix('52203', 52203, DateTime.utc(2027, 1, 10, 19, 30), '1ª Rodada', teamManaus, teamParintins, 'Arena da Amazônia'),
        makeFix('52204', 52204, DateTime.utc(2027, 1, 10, 19, 30), '1ª Rodada', teamManauara, teamPrincesa, 'Estádio Ismael Benigno'),

        // 2ª Rodada (12 a 14 de Janeiro)
        makeFix('52205', 52205, DateTime.utc(2027, 1, 12, 19, 30), '2ª Rodada', teamFast, teamPrincesa, 'Estádio Ismael Benigno'),
        makeFix('52206', 52206, DateTime.utc(2027, 1, 13, 19, 30), '2ª Rodada', teamParintins, teamManauara, 'Estádio Francisco Garcia'),
        makeFix('52207', 52207, DateTime.utc(2027, 1, 13, 19, 30), '2ª Rodada', teamItacoatiara, teamManaus, 'Estádio Floro de Mendonça'),
        makeFix('52208', 52208, DateTime.utc(2027, 1, 14, 19, 30), '2ª Rodada', teamNacional, teamAmazonas, 'Arena da Amazônia'),

        // 3ª Rodada (15 a 18 de Janeiro)
        makeFix('52209', 52209, DateTime.utc(2027, 1, 15, 19, 30), '3ª Rodada', teamAmazonas, teamFast, 'Estádio Carlos Zamith'),
        makeFix('52210', 52210, DateTime.utc(2027, 1, 16, 19, 30), '3ª Rodada', teamManaus, teamNacional, 'Arena da Amazônia'),
        makeFix('52211', 52211, DateTime.utc(2027, 1, 17, 19, 30), '3ª Rodada', teamManauara, teamItacoatiara, 'Estádio Ismael Benigno'),
        makeFix('52212', 52212, DateTime.utc(2027, 1, 18, 19, 30), '3ª Rodada', teamPrincesa, teamParintins, 'Estádio Gilberto Mestrinho'),

        // 4ª Rodada (20 a 25 de Janeiro)
        makeFix('52213', 52213, DateTime.utc(2027, 1, 20, 19, 30), '4ª Rodada', teamFast, teamParintins, 'Estádio Ismael Benigno'),
        makeFix('52214', 52214, DateTime.utc(2027, 1, 23, 19, 30), '4ª Rodada', teamItacoatiara, teamPrincesa, 'Estádio Floro de Mendonça'),
        makeFix('52215', 52215, DateTime.utc(2027, 1, 24, 19, 30), '4ª Rodada', teamNacional, teamManauara, 'Arena da Amazônia'),
        makeFix('52216', 52216, DateTime.utc(2027, 1, 25, 19, 30), '4ª Rodada', teamAmazonas, teamManaus, 'Arena da Amazônia'),

        // 5ª Rodada (28 de Janeiro a 4 de Fevereiro)
        makeFix('52217', 52217, DateTime.utc(2027, 1, 28, 19, 30), '5ª Rodada', teamManaus, teamFast, 'Arena da Amazônia'),
        makeFix('52218', 52218, DateTime.utc(2027, 1, 31, 19, 30), '5ª Rodada', teamManauara, teamAmazonas, 'Estádio Ismael Benigno'),
        makeFix('52219', 52219, DateTime.utc(2027, 2, 2, 19, 30), '5ª Rodada', teamPrincesa, teamNacional, 'Estádio Gilberto Mestrinho'),
        makeFix('52220', 52220, DateTime.utc(2027, 2, 4, 19, 30), '5ª Rodada', teamParintins, teamItacoatiara, 'Estádio Francisco Garcia'),

        // 6ª Rodada (11 a 15 de Fevereiro)
        makeFix('52221', 52221, DateTime.utc(2027, 2, 11, 19, 30), '6ª Rodada', teamFast, teamItacoatiara, 'Estádio Ismael Benigno'),
        makeFix('52222', 52222, DateTime.utc(2027, 2, 13, 19, 30), '6ª Rodada', teamNacional, teamParintins, 'Arena da Amazônia'),
        makeFix('52223', 52223, DateTime.utc(2027, 2, 14, 19, 30), '6ª Rodada', teamAmazonas, teamPrincesa, 'Estádio Carlos Zamith'),
        makeFix('52224', 52224, DateTime.utc(2027, 2, 15, 19, 30), '6ª Rodada', teamManaus, teamManauara, 'Arena da Amazônia'),

        // 7ª Rodada (17 a 21 de Fevereiro)
        makeFix('52225', 52225, DateTime.utc(2027, 2, 17, 19, 30), '7ª Rodada', teamManauara, teamFast, 'Estádio Ismael Benigno'),
        makeFix('52226', 52226, DateTime.utc(2027, 2, 20, 19, 30), '7ª Rodada', teamPrincesa, teamManaus, 'Estádio Gilberto Mestrinho'),
        makeFix('52227', 52227, DateTime.utc(2027, 2, 21, 19, 30), '7ª Rodada', teamParintins, teamAmazonas, 'Estádio Francisco Garcia'),
        makeFix('52228', 52228, DateTime.utc(2027, 2, 21, 19, 30), '7ª Rodada', teamItacoatiara, teamNacional, 'Estádio Floro de Mendonça'),
      ];
    }

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    List<Standing> sortedStandings = StandingsEngine.sortStandings(rawStandings);

    // Se a tabela estiver vazia, inicializa os 8 clubes oficiais do Barezão 2027
    if (sortedStandings.isEmpty) {
      final defaultClubs = [
        teamNacional,
        teamAmazonas,
        teamManaus,
        teamManauara,
        teamPrincesa,
        teamParintins,
        teamItacoatiara,
        teamFast,
      ];
      sortedStandings = List.generate(defaultClubs.length, (i) {
        final t = defaultClubs[i];
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
          group: 'Primeira Fase',
        );
      });
    }

    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 7);

    final primeiraFase = CompetitionPhase(
      id: 'primeira_fase_am',
      name: '1ª Fase (Classificatória - Turno Único)',
      type: PhaseType.league,
      legs: 1,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '1º e 2º colocados avançam diretamente às Semifinais. Do 3º ao 6º colocados disputam os Playoffs (Quartas de Final). O 7º colocado permanece na Série A e o 8º é rebaixado à Série B.',
      relegationRuleDescription: 'O 8º e último colocado geral é rebaixado diretamente para a Série B de 2028.',
    );

    // -------------------------------------------------------------
    // 2. 2ª Fase: Playoffs de Quartas de Final (Ida e Volta: 3º x 6º e 4º x 5º)
    // -------------------------------------------------------------
    final playoffFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('playoff') || r.contains('play-off') || r.contains('play off') || r.contains('quarter') || r.contains('quartas')) &&
          !r.contains('semi') && !r.contains('final');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final playoffTies = BracketEngine.generateAmazonensePlayoffs(
      sortedStandings,
      playoffFixtures,
    );

    final playoffsPhase = CompetitionPhase(
      id: 'playoffs_am',
      name: '2ª Fase (Playoffs - Quartas de Final)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: playoffFixtures,
      ties: playoffTies,
      qualificationRuleDescription: 'Playoffs em jogos de ida e volta (3º x 6º e 4º x 5º). Os clubes de melhor campanha (3º e 4º) decidem em casa e jogam com a vantagem do empate no agregado. Os vencedores avançam para as Semifinais.',
    );

    // -------------------------------------------------------------
    // 3. 3ª Fase: Semifinais (Ida e Volta: 1º x Venc. P2 e 2º x Venc. P1)
    // -------------------------------------------------------------
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final semiTies = BracketEngine.generateAmazonenseSemifinais(
      sortedStandings,
      playoffTies,
      semiFixtures,
    );

    final semifinaisPhase = CompetitionPhase(
      id: 'semifinais_am',
      name: '3ª Fase (Semifinais - Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (1º Colocado x Vencedor Playoff 2 e 2º Colocado x Vencedor Playoff 1). Não há vantagem do empate: em caso de igualdade no agregado, a vaga na final é decidida nos pênaltis.',
    );

    // -------------------------------------------------------------
    // 4. 4ª Fase: Grande Final (Jogo Único)
    // -------------------------------------------------------------
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) &&
          !r.contains('semi') &&
          !r.contains('quarter') &&
          !r.contains('playoff');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateAmazonenseFinal(semiTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_am',
      name: '4ª Fase (Grande Final - Jogo Único)',
      type: PhaseType.finalStage,
      legs: 1,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'A decisão do título do Barezão 2027 será disputada em jogo único entre os dois vencedores das semifinais. Em caso de empate no tempo normal, a decisão será nos pênaltis.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brasil',
      division: DivisionLevel.a1,
      phases: [
        primeiraFase,
        playoffsPhase,
        semifinaisPhase,
        finalPhase,
      ],
    );
  }

  // --- GENÉRICO (Fallback) ---
  static Competition _buildGenericCompetition({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    final rounds = _extractRounds(rawFixtures, 38);
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);

    final mainPhase = CompetitionPhase(
      id: 'phase_main',
      name: 'Fase Principal',
      type: PhaseType.league,
      rounds: rounds,
      fixtures: rawFixtures,
      standings: sortedStandings,
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      phases: [mainPhase],
    );
  }

  static int _extractRoundNumber(String? r) {
    if (r == null) return 999;
    final match = RegExp(r'\d+').firstMatch(r);
    return match != null ? (int.tryParse(match.group(0)!) ?? 999) : 999;
  }

  static List<PhaseRound> _extractRounds(
    List<Fixture> fixtures,
    int maxRounds, {
    String prefix = 'Rodada ',
  }) {
    final Map<int, List<Fixture>> roundsMap = {};

    for (final fix in fixtures) {
      final roundNum = _extractRoundNumber(fix.round);
      final validNum = roundNum != 999 ? roundNum : 1;
      roundsMap.putIfAbsent(validNum, () => []).add(fix);
    }

    for (final list in roundsMap.values) {
      list.sort((a, b) => a.date.compareTo(b.date));
    }

    final sortedKeys = roundsMap.keys.toList()..sort();
    return sortedKeys.map((num) {
      return PhaseRound(
        id: 'round_$num',
        number: num,
        name: '$prefix$num',
        fixtures: roundsMap[num] ?? [],
      );
    }).toList();
  }
}
