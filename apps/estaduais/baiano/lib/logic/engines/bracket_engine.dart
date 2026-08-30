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
        if (phaseId.contains('final') && !phaseId.contains('semi')) {
          title = 'Grande Final (Ida e Volta)';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${tieIndex + 1} (Ida e Volta)';
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
  // SÉRIE A: CAMPEONATO BAIANO 2026
  // ==========================================

  /// Semifinais Série A (Jogo Único: 1º × 4º e 2º × 3º)
  static List<Tie> generateBaianoA1SemiFinals(
    List<Fixture> rawSemiFixtures,
    List<Standing> standings,
  ) {
    if (rawSemiFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'semifinais_a1',
        rawSemiFixtures,
        isTwoLegged: false,
        defaultSeedPairs: const ['1º Colocado x 4º Colocado', '2º Colocado x 3º Colocado'],
      );
    }

    // Projeção a partir da classificação da 1ª Fase
    final team1 = standings.length >= 1 ? _standingToTeam(standings[0]) : null;
    final team2 = standings.length >= 2 ? _standingToTeam(standings[1]) : null;
    final team3 = standings.length >= 3 ? _standingToTeam(standings[2]) : null;
    final team4 = standings.length >= 4 ? _standingToTeam(standings[3]) : null;

    return [
      Tie(
        id: 'semifinais_a1_tie_0',
        phaseId: 'semifinais_a1',
        title: 'Semifinal 1 (Jogo Único)',
        seedHome: '1º Colocado',
        seedAway: '4º Colocado',
        homeTeam: team1,
        awayTeam: team4,
      ),
      Tie(
        id: 'semifinais_a1_tie_1',
        phaseId: 'semifinais_a1',
        title: 'Semifinal 2 (Jogo Único)',
        seedHome: '2º Colocado',
        seedAway: '3º Colocado',
        homeTeam: team2,
        awayTeam: team3,
      ),
    ];
  }

  /// Final Série A (Jogo Único: Vencedor SF1 × Vencedor SF2)
  static List<Tie> generateBaianoA1Final(
    List<Fixture> rawFinalFixtures,
    List<Standing> standings,
  ) {
    if (rawFinalFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'final_a1',
        rawFinalFixtures,
        isTwoLegged: false,
        defaultSeedPairs: const ['Vencedor SF1 x Vencedor SF2'],
      );
    }

    return [
      const Tie(
        id: 'final_a1_tie_0',
        phaseId: 'final_a1',
        title: 'Grande Final (Jogo Único)',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
      ),
    ];
  }

  // ==========================================
  // SÉRIE B: CAMPEONATO BAIANO 2026
  // ==========================================

  /// Semifinais Série B (Ida e Volta: 1º × 4º e 2º × 3º)
  static List<Tie> generateBaianoBSemiFinals(
    List<Fixture> rawSemiFixtures,
    List<Standing> standings,
  ) {
    if (rawSemiFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'semifinais_b',
        rawSemiFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const ['1º Colocado x 4º Colocado', '2º Colocado x 3º Colocado'],
      );
    }

    final team1 = standings.length >= 1 ? _standingToTeam(standings[0]) : null;
    final team2 = standings.length >= 2 ? _standingToTeam(standings[1]) : null;
    final team3 = standings.length >= 3 ? _standingToTeam(standings[2]) : null;
    final team4 = standings.length >= 4 ? _standingToTeam(standings[3]) : null;

    return [
      Tie(
        id: 'semifinais_b_tie_0',
        phaseId: 'semifinais_b',
        title: 'Semifinal 1 (Ida e Volta)',
        seedHome: '1º Colocado',
        seedAway: '4º Colocado',
        homeTeam: team1,
        awayTeam: team4,
      ),
      Tie(
        id: 'semifinais_b_tie_1',
        phaseId: 'semifinais_b',
        title: 'Semifinal 2 (Ida e Volta)',
        seedHome: '2º Colocado',
        seedAway: '3º Colocado',
        homeTeam: team2,
        awayTeam: team3,
      ),
    ];
  }

  /// Final Série B (Ida e Volta: Vencedor SF1 × Vencedor SF2)
  static List<Tie> generateBaianoBFinal(
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
