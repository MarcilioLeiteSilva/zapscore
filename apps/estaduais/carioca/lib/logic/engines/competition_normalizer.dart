import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
import '../models/tie.dart';
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
    if (leagueId == 624) {
      return _buildCariocaA1(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 851) {
      return _buildCariocaA2(
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

  // --- SÉRIE A1: CAMPEONATO CARIOCA 2026 ---
  static Competition _buildCariocaA1({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. Taça Guanabara (Regular Season - 1 a 6)
    final tgFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('regular season') || r.contains('taça guanabara') || r.contains('taca guanabara');
    }).toList();

    tgFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final groupsMap = StandingsEngine.splitCariocaA1Groups(rawStandings);
    final groupAStandings = groupsMap['Grupo A'] ?? [];
    final groupBStandings = groupsMap['Grupo B'] ?? [];

    final groupANames = groupAStandings.map((s) => s.teamName.toLowerCase()).toSet();
    final groupBNames = groupBStandings.map((s) => s.teamName.toLowerCase()).toSet();

    final groupAFixtures = tgFixtures.where((f) {
      final h = f.homeTeam?.name.toLowerCase() ?? '';
      final a = f.awayTeam?.name.toLowerCase() ?? '';
      return groupANames.contains(h) || groupANames.contains(a);
    }).toList();

    final groupBFixtures = tgFixtures.where((f) {
      final h = f.homeTeam?.name.toLowerCase() ?? '';
      final a = f.awayTeam?.name.toLowerCase() ?? '';
      return groupBNames.contains(h) || groupBNames.contains(a);
    }).toList();

    // Rodadas isoladas da Taça Guanabara (1ª a 6ª Rodada)
    final tgRounds = _extractRounds(tgFixtures, 6);

    final tacaGuanabaraPhase = CompetitionPhase(
      id: 'taca_guanabara',
      name: 'Taça Guanabara',
      type: PhaseType.groupStage,
      legs: 1,
      groups: [
        PhaseGroup(
          id: 'group_a',
          name: 'Grupo A',
          standings: groupAStandings,
          fixtures: groupAFixtures,
        ),
        PhaseGroup(
          id: 'group_b',
          name: 'Grupo B',
          standings: groupBStandings,
          fixtures: groupBFixtures,
        ),
      ],
      rounds: tgRounds,
      fixtures: tgFixtures,
      standings: rawStandings,
      qualificationRuleDescription: '4 primeiros de cada grupo avançam para as Quartas de Final. 5º e 6º vão para o Quadrangular do Rebaixamento.',
    );

    // 2. Quadrangular do Rebaixamento (5ºA, 6ºA, 5ºB, 6ºB em 6 rodadas)
    final relFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('relegation') || r.contains('rebaixamento');
    }).toList();

    relFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final relStandings = relFixtures.isNotEmpty
        ? StandingsEngine.calculateStandingsFromFixtures(relFixtures, group: 'Quadrangular')
        : <Standing>[];

    final relRounds = _extractRounds(relFixtures, 6, prefix: 'Rodada ');

    final relegationPhase = CompetitionPhase(
      id: 'relegation_group_a1',
      name: 'Quadrangular do Rebaixamento',
      type: PhaseType.relegation,
      rounds: relRounds,
      fixtures: relFixtures,
      standings: relStandings,
      relegationRuleDescription: 'Disputado em turno e returno (6 rodadas) por 5ºA, 6ºA, 5ºB e 6ºB. O 4º colocado é rebaixado para a Série A2 de 2027.',
    );

    // 3. Separação correta por data UTC das 8 "Semi-finals" da API:
    //    Taça Rio idas:    20/02 BRT (=20/02 23h UTC) e 21/02 BRT (=22/02 00h UTC)
    //    Carioca idas:     22/02 18h BRT (=22/02 21h UTC) e 22/02 20h30 BRT (=22/02 23h30 UTC)
    //    Taça Rio voltas:  27/02 BRT e 28/02 BRT
    //    Carioca voltas:   01/03 BRT e 02/03 BRT
    //    Corte: antes de 22/02 12:00 UTC = Taça Rio; entre 27/02 e 01/03 UTC = Taça Rio
    final allSemiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter') && !r.contains('rio');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    bool isTacaRioSemi(Fixture f) {
      final d = f.date.toUtc();
      // Idas: 20/02 UTC ou 22/02 antes das 12:00 UTC (= 21/02 BRT noite)
      final isIda = (d.month == 2 && d.day == 20) ||
          (d.month == 2 && d.day == 22 && d.hour < 12);
      // Voltas: 27/02 ou 28/02 UTC
      final isVolta = d.month == 2 && (d.day == 27 || d.day == 28);
      return isIda || isVolta;
    }

    final tacaRioSemiFixtures = allSemiFixtures.where(isTacaRioSemi).toList();
    final sfFixtures = allSemiFixtures.where((f) => !isTacaRioSemi(f)).toList();

    // Finals da API: 2 fixtures em round "Final"
    // - 07/03 21h UTC = 07/03 18h BRT → Taça Rio Final (JOGO ÚNICO)
    // - 08/03 21h UTC = 08/03 18h BRT → Final Carioca (JOGO ÚNICO + pênaltis)
    final allFinalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    // Taça Rio Final = fixture de 07/03 (antes de 08/03 12:00 UTC)
    final tacaRioFinalFixtures = allFinalFixtures.where(
      (f) => f.date.toUtc().isBefore(DateTime.utc(2026, 3, 8, 12)),
    ).toList();
    // Carioca Final = fixture de 08/03 (a partir de 08/03 12:00 UTC)
    final cariocaFinalFixtures = allFinalFixtures.where(
      (f) => !f.date.toUtc().isBefore(DateTime.utc(2026, 3, 8, 12)),
    ).toList();

    // Taça Rio: ties de semifinais (ida e volta) e final (jogo único)
    final tacaRioSemiTies = BracketEngine.buildTiesFromFixtures(
      'taca_rio_semi',
      tacaRioSemiFixtures,
      isTwoLegged: true,
      defaultSeedPairs: ['Botafogo x Boavista', 'Bangu x Volta Redonda'],
    );

    final tacaRioFinalTies = BracketEngine.buildTiesFromFixtures(
      'taca_rio_final',
      tacaRioFinalFixtures,
      isTwoLegged: false, // JOGO ÚNICO
      defaultSeedPairs: ['Botafogo x Bangu'],
    );

    final tacaRioPhase = CompetitionPhase(
      id: 'taca_rio',
      name: 'Taça Rio',
      type: PhaseType.playoff,
      legs: 1,
      fixtures: [...tacaRioSemiFixtures, ...tacaRioFinalFixtures],
      ties: [...tacaRioSemiTies, ...tacaRioFinalTies],
      qualificationRuleDescription: 'Disputada pelos 4 clubes eliminados nas Quartas de Final da Série A1.',
    );

    // 4. Quartas de Final do Carioca (jogo único)
    final qfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas')) && !r.contains('rio');
    }).toList();

    qfFixtures.sort((a, b) => a.date.compareTo(b.date));

    final qfTies = BracketEngine.generateCariocaA1QuarterFinals(
      groupAStandings,
      groupBStandings,
      qfFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quarter_finals_a1',
      name: 'Quartas de Final',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: qfFixtures,
      ties: qfTies,
      qualificationRuleDescription: 'Vencedores avançam para as Semifinais. Os 4 perdedores disputam a Taça Rio.',
    );

    // 5. Semifinais do Carioca (ida e volta)
    //    Semifinal 1: Fluminense × Vasco
    //    Semifinal 2: Flamengo × Madureira
    sfFixtures.sort((a, b) => a.date.compareTo(b.date));

    final sfTies = BracketEngine.generateCariocaA1SemiFinals(
      qfTies,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semi_finals_a1',
      name: 'Semifinais',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta. Os 2 vencedores avançam à Grande Final.',
    );

    // 6. Final do Carioca (JOGO ÚNICO com pênaltis — 08/03)
    //    Fluminense 0×0 Flamengo → Flamengo 5×4 pênaltis
    final finalTies = BracketEngine.generateCariocaA1Final(sfTies, cariocaFinalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_a1',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 1,
      fixtures: cariocaFinalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogo único. O vencedor é o Campeão Carioca de 2026.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a1,
      rules: const CompetitionRules(
        relegatedTo: 'Série A2 2027',
      ),
      phases: [
        tacaGuanabaraPhase,
        relegationPhase,
        tacaRioPhase,
        quartasPhase,
        semiPhase,
        finalPhase,
      ],
    );
  }

  // --- SÉRIE A2: CARIOCA 2026 ---
  static Competition _buildCariocaA2({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. Taça Santos Dumont (11 rodadas, 12 clubes em grupo único)
    final tsdFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('1st phase') || r.contains('santos dumont') || r.contains('regular');
    }).toList();

    final tsdRounds = _extractRounds(tsdFixtures, 11);
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);

    final tacaSantosDumontPhase = CompetitionPhase(
      id: 'taca_santos_dumont',
      name: 'Taça Santos Dumont',
      type: PhaseType.league,
      rounds: tsdRounds,
      fixtures: tsdFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '4 primeiros colocados avançam para as Semifinais. Os 2 últimos colocados são rebaixados para a Série B1 de 2027.',
    );

    // 2. Semifinais (ida e volta, 1º x 4º e 2º x 3º)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList();

    final sfTies = BracketEngine.buildTiesFromFixtures(
      'semi_finals_a2',
      sfFixtures,
      isTwoLegged: true,
      advantageForHigherSeed: true,
    );

    final semiPhase = CompetitionPhase(
      id: 'semi_finals_a2',
      name: 'Semifinais',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em ida e volta (1º x 4º e 2º x 3º). 1º e 2º têm vantagem de empate por seed.',
    );

    // 3. Final (ida e volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('final') && !r.contains('semi');
    }).toList();

    final finalTies = BracketEngine.buildTiesFromFixtures(
      'final_a2',
      finalFixtures,
      isTwoLegged: true,
    );

    final finalPhase = CompetitionPhase(
      id: 'final_a2',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em ida e volta. O Campeão é promovido para a Série A1 de 2027.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a2,
      rules: const CompetitionRules(
        promotionCount: 1,
        promotedTo: 'Série A1 2027',
        relegationCount: 2,
        relegatedTo: 'Série B1 2027',
        advantageForSeed: true,
      ),
      phases: [
        tacaSantosDumontPhase,
        semiPhase,
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
