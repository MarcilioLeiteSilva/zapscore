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
    bool isTwoLegged = false,
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
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter') && !phaseId.contains('3rd') && !phaseId.contains('5th')) {
          title = 'Grande Final';
        } else if (phaseId.contains('3rd') || phaseId.contains('terceiro')) {
          title = 'Disputa do 3º Lugar';
        } else if (phaseId.contains('5th') || phaseId.contains('quinto')) {
          title = 'Disputa do 5º Lugar';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${i + 1}';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${i + 1}';
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
      // Ida e Volta (2-legged)
      final Map<String, List<Fixture>> pairMap = {};

      for (final fix in fixtures) {
        final hId = fix.homeTeam?.id ?? '0';
        final aId = fix.awayTeam?.id ?? '0';
        final ids = [hId, aId]..sort();
        final key = ids.join('_');

        pairMap.putIfAbsent(key, () => []).add(fix);
      }

      int tieIndex = 0;
      for (final entry in pairMap.entries) {
        final pairFixtures = entry.value..sort((a, b) => a.date.compareTo(b.date));
        final leg1 = pairFixtures.isNotEmpty ? pairFixtures[0] : null;
        final leg2 = pairFixtures.length > 1 ? pairFixtures[1] : null;

        Team? homeTeam;
        Team? awayTeam;
        int? homeAgg;
        int? awayAgg;
        Team? winner;

        if (leg2 != null) {
          homeTeam = leg2.homeTeam;
          awayTeam = leg2.awayTeam;

          final l1HomeG = leg1?.homeGoals ?? 0;
          final l1AwayG = leg1?.awayGoals ?? 0;
          final l2HomeG = leg2.homeGoals ?? 0;
          final l2AwayG = leg2.awayGoals ?? 0;

          if (leg1?.homeTeam?.id == homeTeam?.id) {
            homeAgg = l1HomeG + l2HomeG;
            awayAgg = l1AwayG + l2AwayG;
          } else {
            homeAgg = l1AwayG + l2HomeG;
            awayAgg = l1HomeG + l2AwayG;
          }

          final finished = (leg2.statusShort == 'FT' || leg2.statusShort == 'AET' || leg2.statusShort == 'PEN');
          if (finished) {
            if (homeAgg > awayAgg) {
              winner = homeTeam;
            } else if (awayAgg > homeAgg) {
              winner = awayTeam;
            }
          }
        } else if (leg1 != null) {
          homeTeam = leg1.homeTeam;
          awayTeam = leg1.awayTeam;
          homeAgg = leg1.homeGoals;
          awayAgg = leg1.awayGoals;
        }

        String title = 'Confronto ${tieIndex + 1}';
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter')) {
          title = 'Grande Final (Ida e Volta)';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${tieIndex + 1} (Ida e Volta)';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${tieIndex + 1} (Ida e Volta)';
        }

        ties.add(Tie(
          id: '${phaseId}_tie_${tieIndex++}',
          phaseId: phaseId,
          title: title,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
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

  static Team? _teamFromStanding(Standing? s) {
    if (s == null) return null;
    return Team(
      id: s.teamId.toString(),
      externalId: s.teamId,
      name: s.teamName,
      logo: s.teamLogo,
      country: 'Brazil',
    );
  }

  // =========================================================================
  // --- 🏆 COPA DO NORDESTE 2026 BRACKETS (MATA-MATA) ---
  // =========================================================================

  /// Quartas de Final da Copa do Nordeste (Jogo Único):
  /// 8 clubes classificados (1º e 2º colocados dos Grupos A, B, C e D)
  /// Mando de campo da melhor campanha
  /// QF 1: 1º Grupo A × 2º Grupo B
  /// QF 2: 1º Grupo B × 2º Grupo A
  /// QF 3: 1º Grupo C × 2º Grupo D
  /// QF 4: 1º Grupo D × 2º Grupo C
  static List<Tie> generateCopaNordesteQuarterFinals(
    List<Standing> groupAStandings,
    List<Standing> groupBStandings,
    List<Standing> groupCStandings,
    List<Standing> groupDStandings,
    List<Fixture> qfFixtures,
  ) {
    if (qfFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quartas_de_final',
        qfFixtures,
        isTwoLegged: false,
        advantageForHigherSeed: true,
        defaultSeedPairs: [
          '1º Grupo A x 2º Grupo B',
          '1º Grupo B x 2º Grupo A',
          '1º Grupo C x 2º Grupo D',
          '1º Grupo D x 2º Grupo C',
        ],
      );
    }

    final sA = groupAStandings;
    final sB = groupBStandings;
    final sC = groupCStandings;
    final sD = groupDStandings;

    return [
      Tie(
        id: 'qf_0',
        phaseId: 'quartas_de_final',
        title: 'Quartas 1 (Jogo Único)',
        seedHome: '1º Grupo A',
        seedAway: '2º Grupo B',
        homeTeam: sA.isNotEmpty ? _teamFromStanding(sA[0]) : null,
        awayTeam: sB.length > 1 ? _teamFromStanding(sB[1]) : null,
        advantageForHigherSeed: true,
      ),
      Tie(
        id: 'qf_1',
        phaseId: 'quartas_de_final',
        title: 'Quartas 2 (Jogo Único)',
        seedHome: '1º Grupo B',
        seedAway: '2º Grupo A',
        homeTeam: sB.isNotEmpty ? _teamFromStanding(sB[0]) : null,
        awayTeam: sA.length > 1 ? _teamFromStanding(sA[1]) : null,
        advantageForHigherSeed: true,
      ),
      Tie(
        id: 'qf_2',
        phaseId: 'quartas_de_final',
        title: 'Quartas 3 (Jogo Único)',
        seedHome: '1º Grupo C',
        seedAway: '2º Grupo D',
        homeTeam: sC.isNotEmpty ? _teamFromStanding(sC[0]) : null,
        awayTeam: sD.length > 1 ? _teamFromStanding(sD[1]) : null,
        advantageForHigherSeed: true,
      ),
      Tie(
        id: 'qf_3',
        phaseId: 'quartas_de_final',
        title: 'Quartas 4 (Jogo Único)',
        seedHome: '1º Grupo D',
        seedAway: '2º Grupo C',
        homeTeam: sD.isNotEmpty ? _teamFromStanding(sD[0]) : null,
        awayTeam: sC.length > 1 ? _teamFromStanding(sC[1]) : null,
        advantageForHigherSeed: true,
      ),
    ];
  }

  /// Semifinais da Copa do Nordeste (Ida e Volta):
  /// SF 1: Vencedor QF 1 × Vencedor QF 2
  /// SF 2: Vencedor QF 3 × Vencedor QF 4
  static List<Tie> generateCopaNordesteSemiFinals(
    List<Tie> qfTies,
    List<Fixture> sfFixtures,
  ) {
    if (sfFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'semifinais',
        sfFixtures,
        isTwoLegged: true,
      );

      final limited = builtTies.take(2).toList();
      return [
        for (int i = 0; i < limited.length; i++)
          Tie(
            id: 'sf_$i',
            phaseId: 'semifinais',
            title: i == 0 ? 'Semifinal 1 (Ida e Volta)' : 'Semifinal 2 (Ida e Volta)',
            seedHome: i == 0 ? 'Vencedor Quartas 1' : 'Vencedor Quartas 3',
            seedAway: i == 0 ? 'Vencedor Quartas 2' : 'Vencedor Quartas 4',
            homeTeam: limited[i].homeTeam,
            awayTeam: limited[i].awayTeam,
            leg1: limited[i].leg1,
            leg2: limited[i].leg2,
            homeAggregateScore: limited[i].homeAggregateScore,
            awayAggregateScore: limited[i].awayAggregateScore,
            winner: limited[i].winner,
          ),
      ];
    }

    Team? winnerOfQf(int index) {
      if (index < qfTies.length) return qfTies[index].winner;
      return null;
    }

    return [
      Tie(
        id: 'sf_0',
        phaseId: 'semifinais',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: 'Vencedor Quartas 1',
        seedAway: 'Vencedor Quartas 2',
        homeTeam: winnerOfQf(0),
        awayTeam: winnerOfQf(1),
      ),
      Tie(
        id: 'sf_1',
        phaseId: 'semifinais',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: 'Vencedor Quartas 3',
        seedAway: 'Vencedor Quartas 4',
        homeTeam: winnerOfQf(2),
        awayTeam: winnerOfQf(3),
      ),
    ];
  }

  /// Grande Final da Copa do Nordeste (Ida e Volta):
  /// Vencedor SF 1 × Vencedor SF 2
  static List<Tie> generateCopaNordesteFinal(
    List<Tie> sfTies,
    List<Fixture> finalFixtures,
  ) {
    Team? winnerOfSf(int index) {
      if (index < sfTies.length) return sfTies[index].winner;
      return null;
    }

    if (finalFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'grande_final',
        finalFixtures,
        isTwoLegged: true,
      );
      final t = builtTies.isNotEmpty ? builtTies.first : null;
      if (t != null) {
        return [
          Tie(
            id: 'final_0',
            phaseId: 'grande_final',
            title: 'Grande Final (Ida e Volta)',
            homeTeam: t.homeTeam,
            awayTeam: t.awayTeam,
            leg1: t.leg1,
            leg2: t.leg2,
            homeAggregateScore: t.homeAggregateScore,
            awayAggregateScore: t.awayAggregateScore,
            winner: t.winner,
          ),
        ];
      }
    }

    return [
      Tie(
        id: 'final_0',
        phaseId: 'grande_final',
        title: 'Grande Final (Ida e Volta)',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
        homeTeam: winnerOfSf(0),
        awayTeam: winnerOfSf(1),
      ),
    ];
  }
}
