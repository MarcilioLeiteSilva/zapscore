import '../models/fixture.dart';
import '../models/team.dart';
import '../models/tie.dart';
import '../models/standing.dart';

class BracketEngine {
  /// Agrupa partidas de uma fase eliminatória em confrontos (Ties)
  /// Suporta jogo único ou ida/volta (2-legged)
  static List<Tie> buildTiesFromFixtures(
    String phaseId,
    List<Fixture> fixtures, {
    bool isTwoLegged = true,
    bool advantageForHigherSeed = false,
    List<String> defaultSeedPairs = const [],
  }) {
    if (fixtures.isEmpty) return [];

    final List<Tie> ties = [];

    if (!isTwoLegged) {
      // Jogo único
      for (int i = 0; i < fixtures.length; i++) {
        final fix = fixtures[i];
        final home = fix.homeTeam;
        final away = fix.awayTeam;

        Team? winner;
        if (fix.statusShort == 'FT' || fix.statusShort == 'AET' || fix.statusShort == 'PEN') {
          final hG = fix.homeGoals ?? 0;
          final aG = fix.awayGoals ?? 0;
          if (hG > aG) {
            winner = home;
          } else if (aG > hG) {
            winner = away;
          }
        }

        String? seedHome;
        String? seedAway;
        if (i < defaultSeedPairs.length) {
          final parts = defaultSeedPairs[i].split(' x ');
          if (parts.length == 2) {
            seedHome = parts[0];
            seedAway = parts[1];
          }
        }

        String title = 'Confronto ${i + 1}';
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter')) {
          title = 'Grande Final';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${i + 1}';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${i + 1}';
        } else if (phaseId.contains('relegation') || phaseId.contains('morte')) {
          title = 'Torneio da Morte ${i + 1}';
        }

        ties.add(Tie(
          id: '${phaseId}_tie_$i',
          phaseId: phaseId,
          title: title,
          seedHome: seedHome,
          seedAway: seedAway,
          homeTeam: home,
          awayTeam: away,
          leg1: fix,
          homeAggregateScore: fix.homeGoals,
          awayAggregateScore: fix.awayGoals,
          winner: winner,
          advantageForHigherSeed: advantageForHigherSeed,
        ));
      }
    } else {
      // Ida e Volta (Agrupa pares de jogos entre os mesmos dois times)
      final Set<String> processedPairs = {};

      for (final f1 in fixtures) {
        final hId1 = f1.homeTeam?.externalId ?? (int.tryParse(f1.homeTeam?.id ?? '') ?? 0);
        final aId1 = f1.awayTeam?.externalId ?? (int.tryParse(f1.awayTeam?.id ?? '') ?? 0);
        final pairKey = hId1 < aId1 ? '${hId1}_$aId1' : '${aId1}_$hId1';

        if (processedPairs.contains(pairKey)) continue;
        processedPairs.add(pairKey);

        // Encontrar jogo de volta
        Fixture leg1 = f1;
        Fixture? leg2;

        for (final f2 in fixtures) {
          if (f2.id == f1.id) continue;
          final hId2 = f2.homeTeam?.externalId ?? (int.tryParse(f2.homeTeam?.id ?? '') ?? 0);
          final aId2 = f2.awayTeam?.externalId ?? (int.tryParse(f2.awayTeam?.id ?? '') ?? 0);
          if ((hId1 == aId2 && aId1 == hId2) || (hId1 == hId2 && aId1 == aId2)) {
            if (f2.date.isBefore(f1.date)) {
              leg1 = f2;
              leg2 = f1;
            } else {
              leg2 = f2;
            }
            break;
          }
        }

        // Definir Mandante do confronto (Mandante do jogo de volta)
        final aggregateHomeTeam = leg2 != null ? leg2.homeTeam : leg1.homeTeam;
        final aggregateAwayTeam = leg2 != null ? leg2.awayTeam : leg1.awayTeam;

        int? homeAgg;
        int? awayAgg;

        if (leg1.homeGoals != null && leg1.awayGoals != null) {
          if (leg2 != null && leg2.homeGoals != null && leg2.awayGoals != null) {
            homeAgg = leg2.homeGoals! + leg1.awayGoals!;
            awayAgg = leg2.awayGoals! + leg1.homeGoals!;
          } else {
            homeAgg = leg1.homeGoals;
            awayAgg = leg1.awayGoals;
          }
        }

        Team? winner;
        if (leg2 != null && (leg2.statusShort == 'FT' || leg2.statusShort == 'AET' || leg2.statusShort == 'PEN')) {
          if (homeAgg != null && awayAgg != null) {
            if (homeAgg > awayAgg) {
              winner = aggregateHomeTeam;
            } else if (awayAgg > homeAgg) {
              winner = aggregateAwayTeam;
            }
          }
        }

        final tieIndex = ties.length;
        String? seedHome;
        String? seedAway;
        if (tieIndex < defaultSeedPairs.length) {
          final parts = defaultSeedPairs[tieIndex].split(' x ');
          if (parts.length == 2) {
            seedHome = parts[0];
            seedAway = parts[1];
          }
        }

        String title = 'Confronto ${tieIndex + 1}';
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter')) {
          title = 'Grande Final (Ida e Volta)';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${tieIndex + 1} (Ida e Volta)';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${tieIndex + 1} (Ida e Volta)';
        } else if (phaseId.contains('relegation') || phaseId.contains('morte')) {
          title = 'Torneio da Morte ${tieIndex + 1} (Ida e Volta)';
        }

        ties.add(Tie(
          id: '${phaseId}_tie_$tieIndex',
          phaseId: phaseId,
          title: title,
          seedHome: seedHome,
          seedAway: seedAway,
          homeTeam: aggregateHomeTeam,
          awayTeam: aggregateAwayTeam,
          leg1: leg1,
          leg2: leg2,
          homeAggregateScore: homeAgg,
          awayAggregateScore: awayAgg,
          winner: winner,
          advantageForHigherSeed: advantageForHigherSeed,
        ));
      }
    }

    return ties;
  }

  // ==========================================
  // SÉRIE A: CAMPEONATO PARANAENSE 2026 (ID 606)
  // ==========================================

  /// Quartas de Final Série A (Ida e Volta - 8 clubes)
  static List<Tie> generateParanaenseA1QuarterFinals(
    List<Fixture> rawQuarterFixtures,
    List<Standing> standingsGroupA,
    List<Standing> standingsGroupB,
    List<Standing> standingsGeneral,
  ) {
    if (rawQuarterFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quartas_a1',
        rawQuarterFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          '1º Grupo A x 4º Grupo B',
          '2º Grupo A x 3º Grupo B',
          '1º Grupo B x 4º Grupo A',
          '2º Grupo B x 3º Grupo A',
        ],
      );
    }

    // Projeção baseada na classificação dos grupos
    final a1 = standingsGroupA.isNotEmpty ? _standingToTeam(standingsGroupA[0]) : null;
    final a2 = standingsGroupA.length >= 2 ? _standingToTeam(standingsGroupA[1]) : null;
    final a3 = standingsGroupA.length >= 3 ? _standingToTeam(standingsGroupA[2]) : null;
    final a4 = standingsGroupA.length >= 4 ? _standingToTeam(standingsGroupA[3]) : null;

    final b1 = standingsGroupB.isNotEmpty ? _standingToTeam(standingsGroupB[0]) : null;
    final b2 = standingsGroupB.length >= 2 ? _standingToTeam(standingsGroupB[1]) : null;
    final b3 = standingsGroupB.length >= 3 ? _standingToTeam(standingsGroupB[2]) : null;
    final b4 = standingsGroupB.length >= 4 ? _standingToTeam(standingsGroupB[3]) : null;

    return [
      Tie(
        id: 'quartas_a1_tie_0',
        phaseId: 'quartas_a1',
        title: 'Quartas de Final 1 (Ida e Volta)',
        seedHome: '1º Grupo A',
        seedAway: '4º Grupo B',
        homeTeam: a1,
        awayTeam: b4,
      ),
      Tie(
        id: 'quartas_a1_tie_1',
        phaseId: 'quartas_a1',
        title: 'Quartas de Final 2 (Ida e Volta)',
        seedHome: '2º Grupo A',
        seedAway: '3º Grupo B',
        homeTeam: a2,
        awayTeam: b3,
      ),
      Tie(
        id: 'quartas_a1_tie_2',
        phaseId: 'quartas_a1',
        title: 'Quartas de Final 3 (Ida e Volta)',
        seedHome: '1º Grupo B',
        seedAway: '4º Grupo A',
        homeTeam: b1,
        awayTeam: a4,
      ),
      Tie(
        id: 'quartas_a1_tie_3',
        phaseId: 'quartas_a1',
        title: 'Quartas de Final 4 (Ida e Volta)',
        seedHome: '2º Grupo B',
        seedAway: '3º Grupo A',
        homeTeam: b2,
        awayTeam: a3,
      ),
    ];
  }

  /// Semifinais Série A (Ida e Volta: Vencedor QF1 × QF2 e Vencedor QF3 × QF4)
  static List<Tie> generateParanaenseA1SemiFinals(
    List<Fixture> rawSemiFixtures,
    List<Standing> standings,
  ) {
    if (rawSemiFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'semifinais_a1',
        rawSemiFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          'Vencedor QF1 x Vencedor QF2',
          'Vencedor QF3 x Vencedor QF4',
        ],
      );
    }

    return [
      const Tie(
        id: 'semifinais_a1_tie_0',
        phaseId: 'semifinais_a1',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: 'Vencedor QF 1',
        seedAway: 'Vencedor QF 2',
      ),
      const Tie(
        id: 'semifinais_a1_tie_1',
        phaseId: 'semifinais_a1',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: 'Vencedor QF 3',
        seedAway: 'Vencedor QF 4',
      ),
    ];
  }

  /// Final Série A (Ida e Volta: Vencedor SF1 × Vencedor SF2)
  static List<Tie> generateParanaenseA1Final(
    List<Fixture> rawFinalFixtures,
    List<Standing> standings,
  ) {
    if (rawFinalFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'final_a1',
        rawFinalFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const ['Vencedor SF1 x Vencedor SF2'],
      );
    }

    return [
      const Tie(
        id: 'final_a1_tie_0',
        phaseId: 'final_a1',
        title: 'Grande Final (Ida e Volta)',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
      ),
    ];
  }

  /// Torneio da Morte / Rebaixamento Série A (Ida e Volta: 9º × 12º e 10º × 11º)
  static List<Tie> generateParanaenseA1Relegation(
    List<Fixture> rawRelegationFixtures,
    List<Standing> standingsGroupA,
    List<Standing> standingsGroupB,
    List<Standing> standingsGeneral,
  ) {
    if (rawRelegationFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'relegation_a1',
        rawRelegationFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          '9º Colocado x 12º Colocado',
          '10º Colocado x 11º Colocado',
        ],
      );
    }

    final team9 = standingsGeneral.length >= 9 ? _standingToTeam(standingsGeneral[8]) : null;
    final team10 = standingsGeneral.length >= 10 ? _standingToTeam(standingsGeneral[9]) : null;
    final team11 = standingsGeneral.length >= 11 ? _standingToTeam(standingsGeneral[10]) : null;
    final team12 = standingsGeneral.length >= 12 ? _standingToTeam(standingsGeneral[11]) : null;

    return [
      Tie(
        id: 'relegation_a1_tie_0',
        phaseId: 'relegation_a1',
        title: 'Torneio da Morte 1 (Ida e Volta)',
        seedHome: '9º Geral (ou 5º GA)',
        seedAway: '12º Geral (ou 6º GB)',
        homeTeam: team9,
        awayTeam: team12,
      ),
      Tie(
        id: 'relegation_a1_tie_1',
        phaseId: 'relegation_a1',
        title: 'Torneio da Morte 2 (Ida e Volta)',
        seedHome: '10º Geral (ou 5º GB)',
        seedAway: '11º Geral (ou 6º GA)',
        homeTeam: team10,
        awayTeam: team11,
      ),
    ];
  }

  // ==========================================
  // SÉRIE B: CAMPEONATO PARANAENSE 2026 (ID 614)
  // ==========================================

  /// Quartas de Final Série B (Ida e Volta: 1º × 8º, 2º × 7º, 3º × 6º, 4º × 5º)
  static List<Tie> generateParanaenseBQuarterFinals(
    List<Fixture> rawQuarterFixtures,
    List<Standing> standings,
  ) {
    if (rawQuarterFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quartas_b',
        rawQuarterFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          '1º Colocado x 8º Colocado',
          '2º Colocado x 7º Colocado',
          '3º Colocado x 6º Colocado',
          '4º Colocado x 5º Colocado',
        ],
      );
    }

    final t1 = standings.length >= 1 ? _standingToTeam(standings[0]) : null;
    final t2 = standings.length >= 2 ? _standingToTeam(standings[1]) : null;
    final t3 = standings.length >= 3 ? _standingToTeam(standings[2]) : null;
    final t4 = standings.length >= 4 ? _standingToTeam(standings[3]) : null;
    final t5 = standings.length >= 5 ? _standingToTeam(standings[4]) : null;
    final t6 = standings.length >= 6 ? _standingToTeam(standings[5]) : null;
    final t7 = standings.length >= 7 ? _standingToTeam(standings[6]) : null;
    final t8 = standings.length >= 8 ? _standingToTeam(standings[7]) : null;

    return [
      Tie(
        id: 'quartas_b_tie_0',
        phaseId: 'quartas_b',
        title: 'Quartas de Final 1 (Ida e Volta)',
        seedHome: '1º Colocado',
        seedAway: '8º Colocado',
        homeTeam: t1,
        awayTeam: t8,
      ),
      Tie(
        id: 'quartas_b_tie_1',
        phaseId: 'quartas_b',
        title: 'Quartas de Final 2 (Ida e Volta)',
        seedHome: '2º Colocado',
        seedAway: '7º Colocado',
        homeTeam: t2,
        awayTeam: t7,
      ),
      Tie(
        id: 'quartas_b_tie_2',
        phaseId: 'quartas_b',
        title: 'Quartas de Final 3 (Ida e Volta)',
        seedHome: '3º Colocado',
        seedAway: '6º Colocado',
        homeTeam: t3,
        awayTeam: t6,
      ),
      Tie(
        id: 'quartas_b_tie_3',
        phaseId: 'quartas_b',
        title: 'Quartas de Final 4 (Ida e Volta)',
        seedHome: '4º Colocado',
        seedAway: '5º Colocado',
        homeTeam: t4,
        awayTeam: t5,
      ),
    ];
  }

  /// Semifinais Série B (Ida e Volta: Vencedor QF1 × QF4 e Vencedor QF2 × QF3)
  static List<Tie> generateParanaenseBSemiFinals(
    List<Fixture> rawSemiFixtures,
    List<Standing> standings,
  ) {
    if (rawSemiFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'semifinais_b',
        rawSemiFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          'Vencedor QF1 x Vencedor QF4',
          'Vencedor QF2 x Vencedor QF3',
        ],
      );
    }

    return [
      const Tie(
        id: 'semifinais_b_tie_0',
        phaseId: 'semifinais_b',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: 'Vencedor QF 1',
        seedAway: 'Vencedor QF 4',
      ),
      const Tie(
        id: 'semifinais_b_tie_1',
        phaseId: 'semifinais_b',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: 'Vencedor QF 2',
        seedAway: 'Vencedor QF 3',
      ),
    ];
  }

  /// Final Série B (Ida e Volta: Vencedor SF1 × Vencedor SF2)
  static List<Tie> generateParanaenseBFinal(
    List<Fixture> rawFinalFixtures,
    List<Standing> standings,
  ) {
    if (rawFinalFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'final_b',
        rawFinalFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const ['Vencedor SF1 x Vencedor SF2'],
      );
    }

    return [
      const Tie(
        id: 'final_b_tie_0',
        phaseId: 'final_b',
        title: 'Grande Final (Ida e Volta)',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
      ),
    ];
  }

  static Team _standingToTeam(Standing s) {
    return Team(
      id: s.teamId.toString(),
      externalId: s.teamId,
      name: s.teamName,
      logo: s.teamLogo,
      country: 'Brazil',
    );
  }
}
