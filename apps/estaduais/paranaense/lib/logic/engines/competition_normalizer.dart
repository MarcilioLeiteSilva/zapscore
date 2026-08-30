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
    if (leagueId == 606) {
      return _buildParanaenseA1(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 614) {
      return _buildParanaenseB(
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

  // =======================================================
  // --- 🏆 SÉRIE A: CAMPEONATO PARANAENSE 2026 (ID 606) ---
  // =======================================================
  // 1ª Fase (12 clubes, 2 grupos × 6, cruzamento) -> Quartas -> Semis -> Final -> Torneio da Morte
  static Competition _buildParanaenseA1({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Grupos com Cruzamento (6 Rodadas)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('regular season') ||
          r.contains('1st phase') ||
          r.contains('primeira fase') ||
          r.contains('fase de grupos') ||
          r.contains('classificatória');
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final groupsMap = StandingsEngine.splitParanaenseA1Groups(sortedStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 6);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_a1',
      name: '1ª Fase (Grupos A e B)',
      type: PhaseType.groupStage,
      legs: 1,
      groups: [
        PhaseGroup(
          id: 'grupo_a',
          name: 'Grupo A',
          standings: groupsMap['Grupo A'] ?? [],
        ),
        PhaseGroup(
          id: 'grupo_b',
          name: 'Grupo B',
          standings: groupsMap['Grupo B'] ?? [],
        ),
      ],
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: 'Os 4 melhores de cada grupo avançam para as Quartas de Final. Os 4 clubes restantes disputam o Torneio da Morte.',
    );

    // 2. Quartas de Final (Ida e Volta)
    final quarterFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas')) && !r.contains('regular');
    }).toList();

    final quarterTies = BracketEngine.generateParanaenseA1QuarterFinals(
      quarterFixtures,
      groupsMap['Grupo A'] ?? [],
      groupsMap['Grupo B'] ?? [],
      sortedStandings,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quartas_a1',
      name: 'Quartas de Final (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: quarterFixtures,
      ties: quarterTies,
      qualificationRuleDescription: 'Confrontos de ida e volta. Os 4 vencedores avançam para as Semifinais.',
    );

    // 3. Semifinais (Ida e Volta)
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList();

    final semiTies = BracketEngine.generateParanaenseA1SemiFinals(semiFixtures, sortedStandings);

    final semifinaisPhase = CompetitionPhase(
      id: 'semifinais_a1',
      name: 'Semifinais (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Confrontos de ida e volta. Os vencedores avançam para a Grande Final.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) &&
          !r.contains('semi') &&
          !r.contains('quarter') &&
          !r.contains('regular') &&
          !r.contains('relegation') &&
          !r.contains('morte');
    }).toList();

    final finalTies = BracketEngine.generateParanaenseA1Final(finalFixtures, sortedStandings);

    final finalPhase = CompetitionPhase(
      id: 'final_a1',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputa do título em partidas de ida e volta. Vencedor é o Campeão Paranaense 2026.',
    );

    // 5. Torneio da Morte (Playoff de Rebaixamento)
    final relegationFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('relegation') || r.contains('morte') || r.contains('playoff')) &&
          !r.contains('semi') &&
          !r.contains('quarter') &&
          !r.contains('regular');
    }).toList();

    final relegationTies = BracketEngine.generateParanaenseA1Relegation(
      relegationFixtures,
      groupsMap['Grupo A'] ?? [],
      groupsMap['Grupo B'] ?? [],
      sortedStandings,
    );

    final relegationPhase = CompetitionPhase(
      id: 'relegation_a1',
      name: 'Torneio da Morte (Rebaixamento)',
      type: PhaseType.relegation,
      legs: 2,
      fixtures: relegationFixtures,
      ties: relegationTies,
      qualificationRuleDescription: 'Mata-mata dos 4 eliminados da 1ª fase em ida e volta (9º × 12º e 10º × 11º). Os 2 perdedores são rebaixados para a Série B de 2027.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      phases: [
        primeiraFasePhase,
        quartasPhase,
        semifinaisPhase,
        finalPhase,
        relegationPhase,
      ],
    );
  }

  // =======================================================
  // --- 🥈 SÉRIE B: CAMPEONATO PARANAENSE 2026 (ID 614) ---
  // =======================================================
  // 1ª Fase (10 clubes, turno único, 9 rodadas) -> Quartas (8 clubes) -> Semis (Acesso) -> Final
  static Competition _buildParanaenseB({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Classificação (9 Rodadas)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('regular season') ||
          r.contains('1st phase') ||
          r.contains('primeira fase') ||
          r.contains('classificatória') ||
          r.contains('fase de grupos');
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 9);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_b',
      name: '1ª Fase (Classificação)',
      type: PhaseType.league,
      legs: 1,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '1º ao 8º colocados avançam para as Quartas de Final. 9º e 10º colocados são rebaixados para a Série C de 2027.',
      relegationRuleDescription: '9º e 10º colocados são rebaixados para a Série C de 2027.',
    );

    // 2. Quartas de Final (Ida e Volta: 1º × 8º, 2º × 7º, 3º × 6º, 4º × 5º)
    final quarterFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas')) && !r.contains('regular');
    }).toList();

    final quarterTies = BracketEngine.generateParanaenseBQuarterFinals(quarterFixtures, sortedStandings);

    final quartasPhase = CompetitionPhase(
      id: 'quartas_b',
      name: 'Quartas de Final (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: quarterFixtures,
      ties: quarterTies,
      qualificationRuleDescription: 'Confrontos de ida e volta (1º × 8º, 2º × 7º, 3º × 6º, 4º × 5º). Vencedores avançam para as Semifinais.',
    );

    // 3. Semifinais (Ida e Volta - Vale o Acesso!)
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList();

    final semiTies = BracketEngine.generateParanaenseBSemiFinals(semiFixtures, sortedStandings);

    final semifinaisPhase = CompetitionPhase(
      id: 'semifinais_b',
      name: 'Semifinais (Acesso à Série A)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Confrontos de ida e volta. Os dois finalistas garantem o acesso à Série A de 2027.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) && !r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList();

    final finalTies = BracketEngine.generateParanaenseBFinal(finalFixtures, sortedStandings);

    final finalPhase = CompetitionPhase(
      id: 'final_b',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputa do título em jogos de ida e volta. Vencedor é o Campeão da Série B.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      phases: [
        primeiraFasePhase,
        quartasPhase,
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
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final rounds = _extractRounds(rawFixtures, 38);

    final mainPhase = CompetitionPhase(
      id: 'fase_unica',
      name: 'Classificação',
      type: PhaseType.league,
      legs: 1,
      rounds: rounds,
      fixtures: rawFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: 'Tabela de classificação oficial.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      phases: [mainPhase],
    );
  }

  // --- MÉTODOS AUXILIARES ---
  static List<PhaseRound> _extractRounds(List<Fixture> fixtures, int maxRounds) {
    final Map<int, List<Fixture>> roundMap = {};

    for (final f in fixtures) {
      final roundNum = _extractRoundNumber(f.round);
      if (roundNum > 0) {
        roundMap.putIfAbsent(roundNum, () => []).add(f);
      }
    }

    final List<PhaseRound> result = [];
    final sortedKeys = roundMap.keys.toList()..sort();

    for (final rNum in sortedKeys) {
      result.add(PhaseRound(
        id: 'round_$rNum',
        number: rNum,
        name: '$rNumª Rodada',
        fixtures: roundMap[rNum]!,
      ));
    }

    return result;
  }

  static int _extractRoundNumber(String? roundStr) {
    if (roundStr == null) return 0;
    final match = RegExp(r'(\d+)').firstMatch(roundStr);
    if (match != null) {
      return int.tryParse(match.group(1) ?? '0') ?? 0;
    }
    return 0;
  }
}
