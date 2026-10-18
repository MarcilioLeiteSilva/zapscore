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
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter')) {
          title = 'Grande Final (Jogo Único)';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${i + 1} (Jogo Único)';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${i + 1} (Jogo Único)';
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
  // CAMPEONATO PERNAMBUCANO 2026/2027 (TURNO FORRÓ)
  // ==========================================

  /// Oitavas de Final (16 clubes · 8 confrontos · Jogo Único com mando da melhor campanha)
  static List<Tie> generatePernambucanoOitavas({
    required List<Fixture> rawOitavasFixtures,
    List<Standing> standingsA = const [],
    List<Standing> standingsB = const [],
    List<Standing> standingsC = const [],
    List<Standing> standingsD = const [],
  }) {
    if (rawOitavasFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'oitavas_forro',
        rawOitavasFixtures,
        isTwoLegged: false,
        defaultSeedPairs: const [
          '1º Grupo A x 4º Grupo B',
          '2º Grupo A x 3º Grupo B',
          '1º Grupo B x 4º Grupo A',
          '2º Grupo B x 3º Grupo A',
          '1º Grupo C x 4º Grupo D',
          '2º Grupo C x 3º Grupo D',
          '1º Grupo D x 4º Grupo C',
          '2º Grupo D x 3º Grupo C',
        ],
      );
    }

    Team? team(List<Standing> list, int rank) {
      return list.length >= rank ? _standingToTeam(list[rank - 1]) : null;
    }

    final pairs = [
      {'title': 'Oitavas 1: 1ºA × 4ºB', 'homeSeed': '1º Grupo A', 'awaySeed': '4º Grupo B', 'home': team(standingsA, 1), 'away': team(standingsB, 4)},
      {'title': 'Oitavas 2: 2ºA × 3ºB', 'homeSeed': '2º Grupo A', 'awaySeed': '3º Grupo B', 'home': team(standingsA, 2), 'away': team(standingsB, 3)},
      {'title': 'Oitavas 3: 1ºB × 4ºA', 'homeSeed': '1º Grupo B', 'awaySeed': '4º Grupo A', 'home': team(standingsB, 1), 'away': team(standingsA, 4)},
      {'title': 'Oitavas 4: 2ºB × 3ºA', 'homeSeed': '2º Grupo B', 'awaySeed': '3º Grupo A', 'home': team(standingsB, 2), 'away': team(standingsA, 3)},
      {'title': 'Oitavas 5: 1ºC × 4ºD', 'homeSeed': '1º Grupo C', 'awaySeed': '4º Grupo D', 'home': team(standingsC, 1), 'away': team(standingsD, 4)},
      {'title': 'Oitavas 6: 2ºC × 3ºD', 'homeSeed': '2º Grupo C', 'awaySeed': '3º Grupo D', 'home': team(standingsC, 2), 'away': team(standingsD, 3)},
      {'title': 'Oitavas 7: 1ºD × 4ºC', 'homeSeed': '1º Grupo D', 'awaySeed': '4º Grupo C', 'home': team(standingsD, 1), 'away': team(standingsC, 4)},
      {'title': 'Oitavas 8: 2ºD × 3ºC', 'homeSeed': '2º Grupo D', 'awaySeed': '3º Grupo C', 'home': team(standingsD, 2), 'away': team(standingsC, 3)},
    ];

    return List.generate(pairs.length, (i) {
      final p = pairs[i];
      return Tie(
        id: 'oitavas_forro_tie_$i',
        phaseId: 'oitavas_forro',
        title: p['title'] as String,
        seedHome: p['homeSeed'] as String,
        seedAway: p['awaySeed'] as String,
        homeTeam: p['home'] as Team?,
        awayTeam: p['away'] as Team?,
      );
    });
  }

  /// Quartas de Final (8 clubes · 4 confrontos · Jogo Único)
  static List<Tie> generatePernambucanoQuartas(List<Fixture> rawQuartasFixtures) {
    if (rawQuartasFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quartas_forro',
        rawQuartasFixtures,
        isTwoLegged: false,
        defaultSeedPairs: const [
          'Venc. Oitavas 1 x Venc. Oitavas 2',
          'Venc. Oitavas 3 x Venc. Oitavas 4',
          'Venc. Oitavas 5 x Venc. Oitavas 6',
          'Venc. Oitavas 7 x Venc. Oitavas 8',
        ],
      );
    }

    return [
      const Tie(
        id: 'quartas_forro_tie_0',
        phaseId: 'quartas_forro',
        title: 'Quartas 1 (Jogo Único)',
        seedHome: 'Venc. Oitavas 1',
        seedAway: 'Venc. Oitavas 2',
      ),
      const Tie(
        id: 'quartas_forro_tie_1',
        phaseId: 'quartas_forro',
        title: 'Quartas 2 (Jogo Único)',
        seedHome: 'Venc. Oitavas 3',
        seedAway: 'Venc. Oitavas 4',
      ),
      const Tie(
        id: 'quartas_forro_tie_2',
        phaseId: 'quartas_forro',
        title: 'Quartas 3 (Jogo Único)',
        seedHome: 'Venc. Oitavas 5',
        seedAway: 'Venc. Oitavas 6',
      ),
      const Tie(
        id: 'quartas_forro_tie_3',
        phaseId: 'quartas_forro',
        title: 'Quartas 4 (Jogo Único)',
        seedHome: 'Venc. Oitavas 7',
        seedAway: 'Venc. Oitavas 8',
      ),
    ];
  }

  /// Quartas de Final (Legado 2026: Jogo Único 3º × 6º e 4º × 5º)
  static List<Tie> generatePernambucanoA1QuarterFinals(
    List<Fixture> rawQuarterFixtures,
    List<Standing> standings,
  ) {
    if (rawQuarterFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quartas_a1',
        rawQuarterFixtures,
        isTwoLegged: false,
        defaultSeedPairs: const ['3º Colocado x 6º Colocado', '4º Colocado x 5º Colocado'],
      );
    }

    final team3 = standings.length >= 3 ? _standingToTeam(standings[2]) : null;
    final team4 = standings.length >= 4 ? _standingToTeam(standings[3]) : null;
    final team5 = standings.length >= 5 ? _standingToTeam(standings[4]) : null;
    final team6 = standings.length >= 6 ? _standingToTeam(standings[5]) : null;

    return [
      Tie(
        id: 'quartas_a1_tie_0',
        phaseId: 'quartas_a1',
        title: 'Quartas de Final 1 (3º × 6º)',
        seedHome: '3º Colocado',
        seedAway: '6º Colocado',
        homeTeam: team3,
        awayTeam: team6,
      ),
      Tie(
        id: 'quartas_a1_tie_1',
        phaseId: 'quartas_a1',
        title: 'Quartas de Final 2 (4º × 5º)',
        seedHome: '4º Colocado',
        seedAway: '5º Colocado',
        homeTeam: team4,
        awayTeam: team5,
      ),
    ];
  }

  /// Semifinais (Ida e Volta: 1º × Vencedor QF e 2º × Vencedor QF)
  static List<Tie> generatePernambucanoA1SemiFinals(
    List<Fixture> rawSemiFixtures,
    List<Standing> standings,
  ) {
    if (rawSemiFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'semifinais_a1',
        rawSemiFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const ['1º Colocado x Vencedor QF', '2º Colocado x Vencedor QF'],
      );
    }

    final team1 = standings.length >= 1 ? _standingToTeam(standings[0]) : null;
    final team2 = standings.length >= 2 ? _standingToTeam(standings[1]) : null;

    return [
      Tie(
        id: 'semifinais_a1_tie_0',
        phaseId: 'semifinais_a1',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: '1º Colocado',
        seedAway: 'Vencedor Quartas',
        homeTeam: team1,
      ),
      Tie(
        id: 'semifinais_a1_tie_1',
        phaseId: 'semifinais_a1',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: '2º Colocado',
        seedAway: 'Vencedor Quartas',
        homeTeam: team2,
      ),
    ];
  }

  /// Final (Ida e Volta: Vencedor SF1 × Vencedor SF2)
  static List<Tie> generatePernambucanoA1Final(
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
