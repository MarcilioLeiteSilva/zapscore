import '../models/tie.dart';
import '../models/fixture.dart';
import '../models/team.dart';

class BracketEngine {
  /// Agrupa fixtures em confrontos (Ties), detectando jogos únicos ou jogos de ida e volta (Two-Legged)
  static List<Tie> buildTiesFromFixtures(
    String phaseId,
    List<Fixture> fixtures, {
    bool isTwoLegged = false,
    bool advantageForHigherSeed = false,
  }) {
    final List<Tie> ties = [];

    if (!isTwoLegged) {
      // Jogo único
      for (int i = 0; i < fixtures.length; i++) {
        final fix = fixtures[i];
        final homeG = fix.homeGoals ?? 0;
        final awayG = fix.awayGoals ?? 0;
        final isFinished = fix.statusShort == 'FT' || fix.statusShort == 'AET' || fix.statusShort == 'PEN';

        Team? winner;
        if (isFinished) {
          if (homeG > awayG) {
            winner = fix.homeTeam;
          } else if (awayG > homeG) {
            winner = fix.awayTeam;
          } else if (fix.homePenalty != null && fix.awayPenalty != null) {
            if (fix.homePenalty! > fix.awayPenalty!) {
              winner = fix.homeTeam;
            } else if (fix.awayPenalty! > fix.homePenalty!) {
              winner = fix.awayTeam;
            }
          }
        }

        ties.add(Tie(
          id: '${phaseId}_$i',
          phaseId: phaseId,
          title: 'Jogo ${i + 1}',
          homeTeam: fix.homeTeam,
          awayTeam: fix.awayTeam,
          leg1: fix,
          winner: winner,
        ));
      }
    } else {
      // Jogos de ida e volta
      final Map<String, List<Fixture>> pairMap = {};

      for (final fix in fixtures) {
        final hId = fix.homeTeam?.externalId ?? 0;
        final aId = fix.awayTeam?.externalId ?? 0;
        final pairKey = hId < aId ? '${hId}_$aId' : '${aId}_$hId';
        pairMap.putIfAbsent(pairKey, () => []).add(fix);
      }

      int tieIndex = 0;
      for (final pairFixtures in pairMap.values) {
        pairFixtures.sort((a, b) => a.date.compareTo(b.date));
        final leg1 = pairFixtures.isNotEmpty ? pairFixtures[0] : null;
        final leg2 = pairFixtures.length > 1 ? pairFixtures[1] : null;

        final teamA = leg1?.homeTeam;
        final teamB = leg1?.awayTeam;

        int homeAgg = 0;
        int awayAgg = 0;
        bool hasFinishedLegs = false;

        if (leg1 != null && (leg1.statusShort == 'FT' || leg1.statusShort == 'AET' || leg1.statusShort == 'PEN')) {
          homeAgg += leg1.homeGoals ?? 0;
          awayAgg += leg1.awayGoals ?? 0;
          hasFinishedLegs = true;
        }

        if (leg2 != null && (leg2.statusShort == 'FT' || leg2.statusShort == 'AET' || leg2.statusShort == 'PEN')) {
          if (leg2.homeTeam?.externalId == teamA?.externalId) {
            homeAgg += leg2.homeGoals ?? 0;
            awayAgg += leg2.awayGoals ?? 0;
          } else {
            homeAgg += leg2.awayGoals ?? 0;
            awayAgg += leg2.homeGoals ?? 0;
          }
          hasFinishedLegs = true;
        }

        Team? winner;
        if (hasFinishedLegs && leg2 != null && (leg2.statusShort == 'FT' || leg2.statusShort == 'AET' || leg2.statusShort == 'PEN')) {
          if (homeAgg > awayAgg) {
            winner = teamA;
          } else if (awayAgg > homeAgg) {
            winner = teamB;
          }
        }

        ties.add(Tie(
          id: '${phaseId}_$tieIndex',
          phaseId: phaseId,
          title: 'Confronto ${++tieIndex}',
          homeTeam: teamA,
          awayTeam: teamB,
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
}
