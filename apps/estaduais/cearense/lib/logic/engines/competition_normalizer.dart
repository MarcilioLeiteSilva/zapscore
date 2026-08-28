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
    if (leagueId == 609 || leagueId == 607) {
      return _buildCearenseA1(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 620 || leagueId == 617) {
      return _buildCearenseB(
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

  // =========================================================================
  // --- 🏆 SÉRIE A: CAMPEONATO CEARENSE 2026 (ID 607) ---
  // =========================================================================
  // 1ª Fase (10 clubes em 2 grupos × 5)
  // 2ª Fase (Grupos C e D com confrontos cruzados C × D)
  // Semifinais (1º C × 2º C e 1º D × 2º D em Ida/Volta)
  // Disputa 5º Lugar (3º C × 3º D em Jogo Único)
  // Disputa 3º Lugar (Perdedores Semis em Jogo Único)
  // Grande Final (Ida e Volta)
  // Quadrangular da Permanência (4ºA, 5ºA, 4ºB, 5ºB - 2 rebaixados)
  static Competition _buildCearenseA1({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // -------------------------------------------------------------
    // 1. 1ª Fase: Grupos A e B (5 Rodadas, turno único no grupo)
    // -------------------------------------------------------------
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      final isSecondPhase = r.contains('2nd phase') || r.contains('segunda fase') || r.contains('grupo c') || r.contains('grupo d');
      final isRel = r.contains('relegation') || r.contains('permanência') || r.contains('rebaixamento');
      final isKnockout = r.contains('semi') || r.contains('final') || r.contains('quarter') || r.contains('3rd') || r.contains('5th');
      return !isSecondPhase && !isRel && !isKnockout;
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final groupsMap1st = StandingsEngine.splitCearenseA1Groups(sortedStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 5);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_a1',
      name: '1ª Fase (Grupos A e B)',
      type: PhaseType.groupStage,
      legs: 1,
      groups: [
        PhaseGroup(
          id: 'grupo_a',
          name: 'Grupo A',
          standings: groupsMap1st['Grupo A'] ?? [],
        ),
        PhaseGroup(
          id: 'grupo_b',
          name: 'Grupo B',
          standings: groupsMap1st['Grupo B'] ?? [],
        ),
      ],
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: 'Os 3 primeiros de cada grupo avançam para a 2ª Fase (Grupos C e D). Os 2 últimos de cada grupo vão para o Quadrangular da Permanência.',
      relegationRuleDescription: '4º e 5º de cada grupo disputam a permanência.',
    );

    // -------------------------------------------------------------
    // 2. 2ª Fase: Grupos C e D (Confrontos Cruzados C × D, 3 jogos)
    // -------------------------------------------------------------
    final secondPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('2nd phase') ||
          r.contains('segunda fase') ||
          r.contains('grupo c') ||
          r.contains('grupo d') ||
          r.contains('group c') ||
          r.contains('group d');
    }).toList();

    secondPhaseFixtures.sort((a, b) => a.date.compareTo(b.date));

    final secondPhaseStandings = secondPhaseFixtures.isNotEmpty
        ? StandingsEngine.calculateStandingsFromFixtures(secondPhaseFixtures)
        : <Standing>[];

    final groupsMap2nd = StandingsEngine.splitCearenseA1SecondPhaseGroups(
      secondPhaseStandings.isNotEmpty ? secondPhaseStandings : sortedStandings,
    );

    final secondPhaseRounds = _extractRounds(secondPhaseFixtures, 3, prefix: 'Rodada ');

    final segundaFasePhase = CompetitionPhase(
      id: 'segunda_fase_a1',
      name: '2ª Fase (Grupos C e D - Cruzamento)',
      type: PhaseType.groupStage,
      legs: 1,
      groups: [
        PhaseGroup(
          id: 'grupo_c',
          name: 'Grupo C (3 classificados do Gr. A)',
          standings: groupsMap2nd['Grupo C'] ?? [],
        ),
        PhaseGroup(
          id: 'grupo_d',
          name: 'Grupo D (3 classificados do Gr. B)',
          standings: groupsMap2nd['Grupo D'] ?? [],
        ),
      ],
      rounds: secondPhaseRounds,
      fixtures: secondPhaseFixtures,
      standings: secondPhaseStandings,
      qualificationRuleDescription: 'Confrontos cruzados (Grupo C × Grupo D em turno único). 1º e 2º colocados de C e D avançam para as Semifinais. 3º de C e 3º de D disputam o 5º lugar.',
    );

    // -------------------------------------------------------------
    // 3. Semifinais (Ida e Volta: 1º C × 2º C e 1º D × 2º D)
    // -------------------------------------------------------------
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter') && !r.contains('regular') && !r.contains('phase');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final semiTies = BracketEngine.generateCearenseA1SemiFinals(
      groupsMap2nd['Grupo C'] ?? [],
      groupsMap2nd['Grupo D'] ?? [],
      semiFixtures,
    );

    final semifinaisPhase = CompetitionPhase(
      id: 'semi_finals_a1',
      name: 'Semifinais (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (1º C × 2º C e 1º D × 2º D). Vencedores avançam para a Final.',
    );

    // -------------------------------------------------------------
    // 4. Disputa do 5º Lugar (Jogo Único: 3º C × 3º D)
    // -------------------------------------------------------------
    final fifthPlaceFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('5th') || r.contains('quinto') || r.contains('5º');
    }).toList();

    final fifthPlaceTies = BracketEngine.generateCearenseA1FifthPlace(
      groupsMap2nd['Grupo C'] ?? [],
      groupsMap2nd['Grupo D'] ?? [],
      fifthPlaceFixtures,
    );

    final quintoLugarPhase = CompetitionPhase(
      id: 'fifth_place_a1',
      name: 'Disputa do 5º Lugar (Jogo Único)',
      type: PhaseType.playoff,
      legs: 1,
      fixtures: fifthPlaceFixtures,
      ties: fifthPlaceTies,
      qualificationRuleDescription: 'Jogo único entre o 3º do Grupo C e o 3º do Grupo D para definir o 5º colocado geral e vagas nacionais.',
    );

    // -------------------------------------------------------------
    // 5. Disputa do 3º Lugar (Jogo Único: Perdedor SF1 × Perdedor SF2)
    // -------------------------------------------------------------
    final thirdPlaceFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('3rd') || r.contains('third') || r.contains('terceiro') || r.contains('3º');
    }).toList();

    final thirdPlaceTies = BracketEngine.generateCearenseA1ThirdPlace(
      semiTies,
      thirdPlaceFixtures,
    );

    final terceiroLugarPhase = CompetitionPhase(
      id: 'third_place_a1',
      name: 'Disputa do 3º Lugar (Jogo Único)',
      type: PhaseType.playoff,
      legs: 1,
      fixtures: thirdPlaceFixtures,
      ties: thirdPlaceTies,
      qualificationRuleDescription: 'Disputada em jogo único entre os clubes eliminados nas semifinais.',
    );

    // -------------------------------------------------------------
    // 6. Grande Final (Ida e Volta: Vencedor SF1 × Vencedor SF2)
    // -------------------------------------------------------------
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) &&
          !r.contains('semi') &&
          !r.contains('quarter') &&
          !r.contains('3rd') &&
          !r.contains('third') &&
          !r.contains('5th') &&
          !r.contains('relegation') &&
          !r.contains('phase');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateCearenseA1Final(semiTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_a1',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Dois jogos (ida e volta). O clube de melhor campanha acumulada tem o mando de campo do segundo jogo. O vencedor é o Campeão Cearense 2026.',
    );

    // -------------------------------------------------------------
    // 7. Quadrangular da Permanência (4ºA, 5ºA, 4ºB, 5ºB - 2 rebaixados)
    // -------------------------------------------------------------
    final relFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('relegation') || r.contains('permanência') || r.contains('permanencia') || r.contains('rebaixamento');
    }).toList()
      ..sort((a, b) {
        final numA = _extractRoundNumber(a.round);
        final numB = _extractRoundNumber(b.round);
        if (numA != numB) return numA.compareTo(numB);
        return a.date.compareTo(b.date);
      });

    final relStandings = relFixtures.isNotEmpty
        ? StandingsEngine.calculateStandingsFromFixtures(relFixtures, group: 'Permanência')
        : <Standing>[];

    final relRounds = _extractRounds(relFixtures, 3, prefix: 'Rodada ');

    final permanenciaPhase = CompetitionPhase(
      id: 'permanencia_a1',
      name: 'Quadrangular da Permanência',
      type: PhaseType.relegation,
      rounds: relRounds,
      fixtures: relFixtures,
      standings: relStandings,
      relegationRuleDescription: 'Disputado em turno único (3 jogos por equipe) pelos 4ºs e 5ºs colocados da 1ª Fase. Os 2 últimos colocados são rebaixados para a Série B de 2027.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      division: DivisionLevel.a1,
      phases: [
        primeiraFasePhase,
        segundaFasePhase,
        semifinaisPhase,
        terceiroLugarPhase,
        quintoLugarPhase,
        finalPhase,
        permanenciaPhase,
      ],
    );
  }

  // =========================================================================
  // --- 🥈 SÉRIE B: CAMPEONATO CEARENSE 2026 (ID 617) ---
  // =========================================================================
  // 1ª Fase (10 clubes em 2 grupos × 5, Turno + Returno, 10 rodadas)
  // Quartas de Final (2ºA × 3ºB e 2ºB × 3ºA em Jogo Único)
  // Semifinais (1ºA × Vencedor QF e 1ºB × Vencedor QF em Ida e Volta - 2 ACESSOS)
  // Grande Final (Ida e Volta)
  // Disputa do Rebaixamento (4ºA, 5ºA, 4ºB, 5ºB - 2 rebaixados para a Série C 2027)
  static Competition _buildCearenseB({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Grupos A e B (Turno + Returno, 10 Rodadas)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      final isKnockout = r.contains('semi') || r.contains('final') || r.contains('quarter') || r.contains('relegation') || r.contains('rebaixamento');
      return !isKnockout;
    }).toList()
      ..sort((a, b) {
        final numA = _extractRoundNumber(a.round);
        final numB = _extractRoundNumber(b.round);
        if (numA != numB) return numA.compareTo(numB);
        return a.date.compareTo(b.date);
      });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final groupsMap = StandingsEngine.splitCearenseBGroups(sortedStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 10);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_b',
      name: '1ª Fase (Grupos A e B - Turno e Returno)',
      type: PhaseType.groupStage,
      legs: 2,
      groups: [
        PhaseGroup(
          id: 'grupo_a_b',
          name: 'Grupo A',
          standings: groupsMap['Grupo A'] ?? [],
        ),
        PhaseGroup(
          id: 'grupo_b_b',
          name: 'Grupo B',
          standings: groupsMap['Grupo B'] ?? [],
        ),
      ],
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '1º colocado de cada grupo avança direto para as Semifinais. 2º e 3º colocados disputam as Quartas de Final. 4º e 5º vão para a Disputa do Rebaixamento.',
      relegationRuleDescription: '4º e 5º colocados disputam a permanência na Série B.',
    );

    // 2. Quartas de Final (Jogo Único: 2ºA × 3ºB e 2ºB × 3ºA)
    final quarterFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas')) && !r.contains('regular');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final quarterTies = BracketEngine.generateCearenseBQuarterFinals(
      groupsMap['Grupo A'] ?? [],
      groupsMap['Grupo B'] ?? [],
      quarterFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quartas_b',
      name: 'Quartas de Final (Jogo Único)',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: quarterFixtures,
      ties: quarterTies,
      qualificationRuleDescription: 'Jogos únicos (2ºA × 3ºB e 2ºB × 3ºA). Os vencedores avançam para as Semifinais.',
    );

    // 3. Semifinais (Ida e Volta - Vale Acesso à Série A 2027)
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('regular') && !r.contains('quarter');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final semiTies = BracketEngine.generateCearenseBSemiFinals(
      groupsMap['Grupo A'] ?? [],
      groupsMap['Grupo B'] ?? [],
      quarterTies,
      semiFixtures,
    );

    final semifinaisPhase = CompetitionPhase(
      id: 'semi_finals_b',
      name: 'Semifinais (Ida e Volta - Vale Acesso)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Confrontos de ida e volta (1ºA × Vencedor QF e 1ºB × Vencedor QF). Os 2 finalistas garantem acesso à Série A de 2027.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) &&
          !r.contains('semi') &&
          !r.contains('quarter') &&
          !r.contains('relegation');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateCearenseBFinal(semiTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_b',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputa do título da Série B 2026 em partidas de ida e volta. Ambos já estão garantidos na Série A 2027.',
    );

    // 5. Disputa do Rebaixamento (2 rebaixados para a Série C)
    final relFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('relegation') || r.contains('rebaixamento');
    }).toList();

    final relStandings = relFixtures.isNotEmpty
        ? StandingsEngine.calculateStandingsFromFixtures(relFixtures, group: 'Rebaixamento')
        : <Standing>[];

    final relRounds = _extractRounds(relFixtures, 3, prefix: 'Rodada ');

    final rebaixamentoPhase = CompetitionPhase(
      id: 'rebaixamento_b',
      name: 'Disputa do Rebaixamento (Série C 2027)',
      type: PhaseType.relegation,
      rounds: relRounds,
      fixtures: relFixtures,
      standings: relStandings,
      relegationRuleDescription: 'Disputada pelos 4ºs e 5ºs colocados da 1ª Fase. Os 2 últimos são rebaixados para a Série C de 2027.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a2,
      phases: [
        primeiraFasePhase,
        quartasPhase,
        semifinaisPhase,
        finalPhase,
        rebaixamentoPhase,
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
