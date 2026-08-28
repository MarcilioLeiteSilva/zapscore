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
  // --- 🏆 SÉRIE A 2026 BRACKETS ---
  // =========================================================================

  /// Semifinais Série A:
  /// Semifinal 1: 1º Grupo C × 2º Grupo C (Ida e Volta)
  /// Semifinal 2: 1º Grupo D × 2º Grupo D (Ida e Volta)
  static List<Tie> generateCearenseA1SemiFinals(
    List<Standing> groupCStandings,
    List<Standing> groupDStandings,
    List<Fixture> sfFixtures,
  ) {
    if (sfFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'semi_finals_a1',
        sfFixtures,
        isTwoLegged: true,
      );

      final limited = builtTies.take(2).toList();
      return [
        for (int i = 0; i < limited.length; i++)
          Tie(
            id: 'sf_a1_$i',
            phaseId: 'semi_finals_a1',
            title: i == 0 ? 'Semifinal 1 (1º C × 2º C)' : 'Semifinal 2 (1º D × 2º D)',
            seedHome: i == 0 ? '1º Grupo C' : '1º Grupo D',
            seedAway: i == 0 ? '2º Grupo C' : '2º Grupo D',
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

    final sC = groupCStandings;
    final sD = groupDStandings;

    return [
      Tie(
        id: 'sf_a1_0',
        phaseId: 'semi_finals_a1',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: '1º Grupo C',
        seedAway: '2º Grupo C',
        homeTeam: sC.isNotEmpty ? _teamFromStanding(sC[0]) : null,
        awayTeam: sC.length > 1 ? _teamFromStanding(sC[1]) : null,
      ),
      Tie(
        id: 'sf_a1_1',
        phaseId: 'semi_finals_a1',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: '1º Grupo D',
        seedAway: '2º Grupo D',
        homeTeam: sD.isNotEmpty ? _teamFromStanding(sD[0]) : null,
        awayTeam: sD.length > 1 ? _teamFromStanding(sD[1]) : null,
      ),
    ];
  }

  /// Disputa do 5º Lugar da Série A:
  /// 3º Grupo C × 3º Grupo D (Jogo Único)
  static List<Tie> generateCearenseA1FifthPlace(
    List<Standing> groupCStandings,
    List<Standing> groupDStandings,
    List<Fixture> fifthFixtures,
  ) {
    if (fifthFixtures.isNotEmpty) {
      final built = buildTiesFromFixtures(
        'fifth_place_a1',
        fifthFixtures,
        isTwoLegged: false,
        defaultSeedPairs: ['3º Grupo C x 3º Grupo D'],
      );
      if (built.isNotEmpty) return [built.first];
    }

    final sC = groupCStandings;
    final sD = groupDStandings;

    return [
      Tie(
        id: 'fifth_place_a1_0',
        phaseId: 'fifth_place_a1',
        title: 'Disputa do 5º Lugar (Jogo Único)',
        seedHome: '3º Grupo C',
        seedAway: '3º Grupo D',
        homeTeam: sC.length > 2 ? _teamFromStanding(sC[2]) : null,
        awayTeam: sD.length > 2 ? _teamFromStanding(sD[2]) : null,
      ),
    ];
  }

  /// Disputa do 3º Lugar da Série A:
  /// Perdedor SF1 × Perdedor SF2 (Jogo Único)
  static List<Tie> generateCearenseA1ThirdPlace(
    List<Tie> sfTies,
    List<Fixture> thirdPlaceFixtures,
  ) {
    if (thirdPlaceFixtures.isNotEmpty) {
      final built = buildTiesFromFixtures(
        'third_place_a1',
        thirdPlaceFixtures,
        isTwoLegged: false,
        defaultSeedPairs: ['Perdedor SF1 x Perdedor SF2'],
      );
      if (built.isNotEmpty) return [built.first];
    }

    Team? loserOfSf(int index) {
      if (index < sfTies.length) {
        final t = sfTies[index];
        if (t.winner != null) {
          if (t.winner?.id == t.homeTeam?.id) return t.awayTeam;
          if (t.winner?.id == t.awayTeam?.id) return t.homeTeam;
        }
      }
      return null;
    }

    return [
      Tie(
        id: 'third_place_a1_0',
        phaseId: 'third_place_a1',
        title: 'Disputa do 3º Lugar (Jogo Único)',
        seedHome: 'Perdedor Semifinal 1',
        seedAway: 'Perdedor Semifinal 2',
        homeTeam: loserOfSf(0),
        awayTeam: loserOfSf(1),
      ),
    ];
  }

  /// Grande Final da Série A:
  /// Vencedor SF1 × Vencedor SF2 (Ida e Volta)
  static List<Tie> generateCearenseA1Final(
    List<Tie> sfTies,
    List<Fixture> finalFixtures,
  ) {
    final cleanFinalFixtures = finalFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return !r.contains('3rd') && !r.contains('third') && !r.contains('terceiro') && !r.contains('5th') && !r.contains('quinto');
    }).toList();

    Team? winnerOfSf(int index) {
      if (index < sfTies.length) return sfTies[index].winner;
      return null;
    }

    if (cleanFinalFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'final_a1',
        cleanFinalFixtures,
        isTwoLegged: true,
      );
      final t = builtTies.isNotEmpty ? builtTies.first : null;
      if (t != null) {
        return [
          Tie(
            id: 'final_a1_0',
            phaseId: 'final_a1',
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
        id: 'final_a1_0',
        phaseId: 'final_a1',
        title: 'Grande Final (Ida e Volta)',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
        homeTeam: winnerOfSf(0),
        awayTeam: winnerOfSf(1),
      ),
    ];
  }

  // =========================================================================
  // --- 🥈 SÉRIE B 2026 BRACKETS ---
  // =========================================================================

  /// Quartas de Final da Série B (Jogo Único):
  /// QF1: 2º Grupo A × 3º Grupo B
  /// QF2: 2º Grupo B × 3º Grupo A
  static List<Tie> generateCearenseBQuarterFinals(
    List<Standing> groupAStandings,
    List<Standing> groupBStandings,
    List<Fixture> qfFixtures,
  ) {
    if (qfFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quarter_finals_b',
        qfFixtures,
        isTwoLegged: false,
        defaultSeedPairs: [
          '2º Grupo A x 3º Grupo B',
          '2º Grupo B x 3º Grupo A',
        ],
      );
    }

    final sA = groupAStandings;
    final sB = groupBStandings;

    return [
      Tie(
        id: 'qf_b_0',
        phaseId: 'quarter_finals_b',
        title: 'Quartas 1 (Jogo Único)',
        seedHome: '2º Grupo A',
        seedAway: '3º Grupo B',
        homeTeam: sA.length > 1 ? _teamFromStanding(sA[1]) : null,
        awayTeam: sB.length > 2 ? _teamFromStanding(sB[2]) : null,
      ),
      Tie(
        id: 'qf_b_1',
        phaseId: 'quarter_finals_b',
        title: 'Quartas 2 (Jogo Único)',
        seedHome: '2º Grupo B',
        seedAway: '3º Grupo A',
        homeTeam: sB.length > 1 ? _teamFromStanding(sB[1]) : null,
        awayTeam: sA.length > 2 ? _teamFromStanding(sA[2]) : null,
      ),
    ];
  }

  /// Semifinais da Série B (Ida e Volta - Vale Acesso à Série A):
  /// SF1: 1º Grupo A × Vencedor QF2 (2ºB × 3ºA)
  /// SF2: 1º Grupo B × Vencedor QF1 (2ºA × 3ºB)
  static List<Tie> generateCearenseBSemiFinals(
    List<Standing> groupAStandings,
    List<Standing> groupBStandings,
    List<Tie> qfTies,
    List<Fixture> sfFixtures,
  ) {
    if (sfFixtures.isNotEmpty) {
      final built = buildTiesFromFixtures(
        'semi_finals_b',
        sfFixtures,
        isTwoLegged: true,
      );

      final limited = built.take(2).toList();
      return [
        for (int i = 0; i < limited.length; i++)
          Tie(
            id: 'sf_b_$i',
            phaseId: 'semi_finals_b',
            title: 'Semifinal ${i + 1} (Acesso à Série A)',
            seedHome: i == 0 ? '1º Grupo A' : '1º Grupo B',
            seedAway: i == 0 ? 'Vencedor Quartas 2' : 'Vencedor Quartas 1',
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

    final sA = groupAStandings;
    final sB = groupBStandings;

    Team? winnerOfQf(int index) {
      if (index < qfTies.length) return qfTies[index].winner;
      return null;
    }

    return [
      Tie(
        id: 'sf_b_0',
        phaseId: 'semi_finals_b',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: '1º Grupo A',
        seedAway: 'Vencedor Quartas 2',
        homeTeam: sA.isNotEmpty ? _teamFromStanding(sA[0]) : null,
        awayTeam: winnerOfQf(1),
      ),
      Tie(
        id: 'sf_b_1',
        phaseId: 'semi_finals_b',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: '1º Grupo B',
        seedAway: 'Vencedor Quartas 1',
        homeTeam: sB.isNotEmpty ? _teamFromStanding(sB[0]) : null,
        awayTeam: winnerOfQf(0),
      ),
    ];
  }

  /// Final da Série B (Ida e Volta):
  /// Finalista 1 × Finalista 2
  static List<Tie> generateCearenseBFinal(
    List<Tie> sfTies,
    List<Fixture> finalFixtures,
  ) {
    Team? winnerOfSf(int index) {
      if (index < sfTies.length) return sfTies[index].winner;
      return null;
    }

    if (finalFixtures.isNotEmpty) {
      final built = buildTiesFromFixtures(
        'final_b',
        finalFixtures,
        isTwoLegged: true,
      );
      final t = built.isNotEmpty ? built.first : null;
      if (t != null) {
        return [
          Tie(
            id: 'final_b_0',
            phaseId: 'final_b',
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
        id: 'final_b_0',
        phaseId: 'final_b',
        title: 'Grande Final (Ida e Volta)',
        seedHome: 'Finalista 1',
        seedAway: 'Finalista 2',
        homeTeam: winnerOfSf(0),
        awayTeam: winnerOfSf(1),
      ),
    ];
  }
}
