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
    if (leagueId == 629) {
      return _buildMineiroModulo1(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 619) {
      return _buildMineiroModulo2(
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

  // --- MÓDULO I: CAMPEONATO MINEIRO 2026 ---
  // 1ª Fase (3 Grupos de 4 clubes, 8 rodadas) -> Semifinais (Ida e Volta) -> Final (Jogo Único)
  static Competition _buildMineiroModulo1({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Classificatória (8 rodadas em turno único contra os clubes dos outros grupos)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('regular season') || r.contains('1st phase') || r.contains('fase de grupos') || r.contains('primeira fase') || r.contains('classificatória') || r.contains('group');
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final groupsMap = StandingsEngine.splitMineiroModulo1Groups(
      rawStandings,
      fixtures: firstPhaseFixtures,
    );

    final groupAStandings = groupsMap['Grupo A'] ?? [];
    final groupBStandings = groupsMap['Grupo B'] ?? [];
    final groupCStandings = groupsMap['Grupo C'] ?? [];
    final generalStandings = groupsMap['Classificação Geral'] ?? StandingsEngine.sortStandings(rawStandings);

    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 8);

    final primeiraFasePhase = CompetitionPhase(
      id: 'fase_grupos_modulo1',
      name: '1ª Fase (Grupos)',
      type: PhaseType.groupStage,
      legs: 1,
      groups: [
        PhaseGroup(
          id: 'grupo_a',
          name: 'Grupo A',
          standings: groupAStandings,
        ),
        PhaseGroup(
          id: 'grupo_b',
          name: 'Grupo B',
          standings: groupBStandings,
        ),
        PhaseGroup(
          id: 'grupo_c',
          name: 'Grupo C',
          standings: groupCStandings,
        ),
        PhaseGroup(
          id: 'classificacao_geral',
          name: 'Geral',
          standings: generalStandings,
        ),
      ],
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: generalStandings,
      qualificationRuleDescription: '1º colocado de cada grupo (A, B e C) + o melhor 2º colocado geral avançam para as Semifinais (4 clubes).',
      relegationRuleDescription: 'Os 2 últimos colocados da Classificação Geral (11º e 12º) são rebaixados para o Módulo II.',
    );

    // 2. Semifinais (Ida e Volta: 1º × 4º e 2º × 3º — Mando do 2º jogo da melhor campanha)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final semiFinalists = StandingsEngine.getMineiroModulo1SemiFinalists(groupsMap);

    final sfTies = BracketEngine.generateMineiroModulo1SemiFinals(
      semiFinalists,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semifinais_modulo1',
      name: 'Semifinais',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (1º × 4º e 2º × 3º). O clube de melhor campanha decide em casa. Em caso de empate no agregado, decisão nos pênaltis.',
    );

    // 3. Grande Final (Jogo Único — Mando definido pela FMF)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' || (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd'));
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateMineiroModulo1Final(sfTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_modulo1',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 1, // Jogo Único no Módulo 1!
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogo único com mando definido pela FMF. Se terminar empatada no tempo normal, o campeão é decidido nos pênaltis.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a1,
      rules: const CompetitionRules(
        relegatedTo: 'Módulo II 2027',
        relegationCount: 2,
      ),
      phases: [
        primeiraFasePhase,
        semiPhase,
        finalPhase,
      ],
    );
  }

  // --- MÓDULO II: CAMPEONATO MINEIRO 2026 ---
  // 1ª Fase (2 Grupos de 6 clubes, 10 rodadas) -> Quartas (Ida e Volta) -> Semi (Ida e Volta - Acesso Módulo I) -> Final (Ida e Volta)
  static Competition _buildMineiroModulo2({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Grupos (10 rodadas em turno e returno dentro de cada grupo)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('1st phase') || r.contains('primeira fase') || (r.contains('regular') && !r.contains('quarter') && !r.contains('semi') && !r.contains('final'));
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final groupsMap = StandingsEngine.splitMineiroModulo2Groups(
      rawStandings,
      fixtures: firstPhaseFixtures,
    );

    final groupAStandings = groupsMap['Grupo A'] ?? [];
    final groupBStandings = groupsMap['Grupo B'] ?? [];
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);

    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 10);

    final primeiraFasePhase = CompetitionPhase(
      id: 'fase_grupos_modulo2',
      name: '1ª Fase (Grupos)',
      type: PhaseType.groupStage,
      legs: 2,
      groups: [
        PhaseGroup(
          id: 'grupo_a_m2',
          name: 'Grupo A',
          standings: groupAStandings,
        ),
        PhaseGroup(
          id: 'grupo_b_m2',
          name: 'Grupo B',
          standings: groupBStandings,
        ),
      ],
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: 'Os 4 melhores de cada grupo (Grupo A e Grupo B) avançam para as Quartas de Final (8 classificados).',
      relegationRuleDescription: 'O 6º colocado do Grupo A e o 6º colocado do Grupo B são rebaixados para a Segunda Divisão.',
    );

    // 2. Quartas de Final (Ida e Volta: 1ºA × 4ºB, 2ºA × 3ºB, 1ºB × 4ºA, 2ºB × 3ºA)
    final qfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('quarter') || r.contains('quartas');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final qfTies = BracketEngine.generateMineiroModulo2QuarterFinals(
      groupAStandings,
      groupBStandings,
      qfFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quartas_modulo2',
      name: 'Quartas de Final',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: qfFixtures,
      ties: qfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (1ºA × 4ºB, 2ºA × 3ºB, 1ºB × 4ºA, 2ºB × 3ºA). Melhor campanha decide em casa e tem vantagem em caso de dois resultados iguais.',
    );

    // 3. Semifinais (Ida e Volta — VALEM O ACESSO AO MÓDULO I ⬆️)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final sfTies = BracketEngine.generateMineiroModulo2SemiFinals(
      qfTies,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semifinais_modulo2',
      name: 'Semifinais (Acesso)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta. Melhor campanha decide em casa e tem vantagem por dois resultados iguais. Os 2 vencedores garantem o ACESSO AO MÓDULO I e avançam para a Final.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' || (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd'));
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateMineiroModulo2Final(sfTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_modulo2',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogos de ida e volta entre os dois clubes já promovidos. Em caso de empate no placar agregado, a decisão é por pênaltis.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a2,
      rules: const CompetitionRules(
        promotionCount: 2,
        promotedTo: 'Módulo I 2027',
        relegationCount: 2,
        relegatedTo: 'Segunda Divisão 2027',
      ),
      phases: [
        primeiraFasePhase,
        quartasPhase,
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
