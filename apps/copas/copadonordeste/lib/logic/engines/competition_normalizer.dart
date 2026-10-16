import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
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
    if (leagueId == 612) {
      return _buildCopaDoNordeste(
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
  // --- 🏆 COPA DO NORDESTE 2026 (ID 612) ---
  // =========================================================================
  // 1. Fase de Grupos: 20 clubes divididos em 4 grupos de 5 (Grupos A, B, C e D)
  //    Confrontos cruzados: A × B e C × D em turno único (5 rodadas por clube)
  //    Avançam os 2 melhores colocados de cada grupo (8 classificados)
  // 2. Quartas de Final: Jogo único com mando da equipe de melhor campanha
  //    (1ºA × 2ºB, 1ºB × 2ºA, 1ºC × 2ºD, 1ºD × 2ºC)
  // 3. Semifinais: Confrontos de ida e volta (Vencedores das Quartas)
  // 4. Grande Final: Confronto de ida e volta definindo o campeão
  static Competition _buildCopaDoNordeste({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // -------------------------------------------------------------
    // 1. Fase de Grupos (Grupos A, B, C e D - 5 Rodadas)
    // -------------------------------------------------------------
    final groupStageFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      final isKnockout = r.contains('semi') ||
          r.contains('final') ||
          r.contains('quarter') ||
          r.contains('quartas');
      return !isKnockout;
    }).toList();

    groupStageFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final groupsMap = StandingsEngine.splitCopaNordesteGroups(sortedStandings);
    final groupStageRounds = _extractRounds(groupStageFixtures, 5);

    final faseDeGruposPhase = CompetitionPhase(
      id: 'fase_de_grupos',
      name: 'Fase de Grupos (Grupos A, B, C e D)',
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
        PhaseGroup(
          id: 'grupo_c',
          name: 'Grupo C',
          standings: groupsMap['Grupo C'] ?? [],
        ),
        PhaseGroup(
          id: 'grupo_d',
          name: 'Grupo D',
          standings: groupsMap['Grupo D'] ?? [],
        ),
      ],
      rounds: groupStageRounds,
      fixtures: groupStageFixtures,
      standings: sortedStandings,
      qualificationRuleDescription:
          '20 clubes divididos em 4 grupos de 5. Confrontos cruzados em turno único: Grupo A enfrenta Grupo B, e Grupo C enfrenta Grupo D (5 partidas por equipe). Os 2 melhores colocados de cada grupo avançam para as Quartas de Final.',
    );

    // -------------------------------------------------------------
    // 2. Quartas de Final (Jogo Único: 1ºA × 2ºB, 1ºB × 2ºA, 1ºC × 2ºD, 1ºD × 2ºC)
    // -------------------------------------------------------------
    final quarterFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas')) && !r.contains('regular');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final quarterTies = BracketEngine.generateCopaNordesteQuarterFinals(
      groupsMap['Grupo A'] ?? [],
      groupsMap['Grupo B'] ?? [],
      groupsMap['Grupo C'] ?? [],
      groupsMap['Grupo D'] ?? [],
      quarterFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quartas_de_final',
      name: 'Quartas de Final (Jogo Único)',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: quarterFixtures,
      ties: quarterTies,
      qualificationRuleDescription:
          'Disputadas em jogo único com mando de campo da equipe de melhor campanha na fase anterior. Os vencedores avançam para as Semifinais.',
    );

    // -------------------------------------------------------------
    // 3. Semifinais (Ida e Volta)
    // -------------------------------------------------------------
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final semiTies = BracketEngine.generateCopaNordesteSemiFinals(
      quarterTies,
      semiFixtures,
    );

    final semifinaisPhase = CompetitionPhase(
      id: 'semifinais',
      name: 'Semifinais (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription:
          'Disputadas em confrontos de ida e volta. Os vencedores avançam para a Grande Final.',
    );

    // -------------------------------------------------------------
    // 4. Grande Final (Ida e Volta)
    // -------------------------------------------------------------
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) &&
          !r.contains('semi') &&
          !r.contains('quarter');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateCopaNordesteFinal(semiTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'grande_final',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription:
          'Disputada em confrontos de ida e volta para definir o campeão do Nordestão 2026. O clube de melhor campanha geral tem o mando de campo no jogo de volta.',
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
        faseDeGruposPhase,
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
