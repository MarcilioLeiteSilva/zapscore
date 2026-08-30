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
          title = 'Grande Final';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${i + 1}';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${i + 1}';
        } else if (phaseId.contains('round_of_16') || phaseId.contains('oitavas')) {
          title = 'Oitavas de Final ${i + 1}';
        } else if (phaseId.contains('playoff')) {
          title = 'Play-off ${i + 1}';
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

        // Definir time mandante agregado (Mandante do jogo de volta)
        final aggregateHomeTeam = leg2 != null ? leg2.homeTeam : leg1.homeTeam;
        final aggregateAwayTeam = leg2 != null ? leg2.awayTeam : leg1.awayTeam;

        int? homeAgg;
        int? awayAgg;
        Team? winner;

        if (leg1.statusShort == 'FT' || leg1.statusShort == 'AET' || leg1.statusShort == 'PEN') {
          final l1HG = leg1.homeGoals ?? 0;
          final l1AG = leg1.awayGoals ?? 0;

          if (leg2 != null && (leg2.statusShort == 'FT' || leg2.statusShort == 'AET' || leg2.statusShort == 'PEN')) {
            final l2HG = leg2.homeGoals ?? 0;
            final l2AG = leg2.awayGoals ?? 0;

            // Mandante do jogo 2 somado com visitante do jogo 1
            if (leg1.homeTeam?.id == aggregateAwayTeam?.id) {
              homeAgg = l2HG + l1AG;
              awayAgg = l2AG + l1HG;
            } else {
              homeAgg = l2HG + l1HG;
              awayAgg = l2AG + l1AG;
            }

            if (homeAgg > awayAgg) {
              winner = aggregateHomeTeam;
            } else if (awayAgg > homeAgg) {
              winner = aggregateAwayTeam;
            }
          } else {
            // Apenas jogo de ida finalizado
            if (aggregateHomeTeam?.id == leg1.homeTeam?.id) {
              homeAgg = l1HG;
              awayAgg = l1AG;
            } else {
              homeAgg = l1AG;
              awayAgg = l1HG;
            }
          }
        }

        final index = ties.length;
        String? seedHome;
        String? seedAway;
        if (index < defaultSeedPairs.length) {
          final parts = defaultSeedPairs[index].split(' x ');
          if (parts.length == 2) {
            seedHome = parts[0];
            seedAway = parts[1];
          }
        }

        String title = 'Confronto ${index + 1}';
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter')) {
          title = 'Grande Final';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${index + 1}';
        } else if (phaseId.contains('quarter') || phaseId.contains('quartas')) {
          title = 'Quartas de Final ${index + 1}';
        } else if (phaseId.contains('round_of_16') || phaseId.contains('oitavas')) {
          title = 'Oitavas de Final ${index + 1}';
        } else if (phaseId.contains('playoff')) {
          title = 'Play-off ${index + 1}';
        }

        ties.add(Tie(
          id: '${phaseId}_tie_$index',
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

  /// 1. Play-offs Eliminatórios da Champions League (9º a 24º da Fase de Liga)
  static List<Tie> generateChampionsPlayoffs(List<Standing> leagueStandings, List<Fixture> playoffFixtures) {
    if (playoffFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'champions_playoffs',
        playoffFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          '9º/10º Colocado x 23º/24º Colocado',
          '11º/12º Colocado x 21º/22º Colocado',
          '13º/14º Colocado x 19º/20º Colocado',
          '15º/16º Colocado x 17º/18º Colocado',
          '9º/10º Colocado x 23º/24º Colocado',
          '11º/12º Colocado x 21º/22º Colocado',
          '13º/14º Colocado x 19º/20º Colocado',
          '15º/16º Colocado x 17º/18º Colocado',
        ],
      );
    }

    // Chaveamento preliminar baseado nos 9º-24º da fase de liga
    final sorted = List<Standing>.from(leagueStandings);
    final List<Tie> ties = [];

    for (int i = 0; i < 8; i++) {
      final highSeedIdx = 8 + i; // 9º ao 16º
      final lowSeedIdx = 23 - i; // 24º ao 17º

      final highSeed = highSeedIdx < sorted.length ? sorted[highSeedIdx] : null;
      final lowSeed = lowSeedIdx < sorted.length ? sorted[lowSeedIdx] : null;

      ties.add(Tie(
        id: 'champions_playoffs_tie_$i',
        phaseId: 'champions_playoffs',
        title: 'Play-off ${i + 1}',
        seedHome: '${highSeedIdx + 1}º Fase de Liga',
        seedAway: '${lowSeedIdx + 1}º Fase de Liga',
        homeTeam: highSeed != null ? Team(id: highSeed.teamId.toString(), externalId: highSeed.teamId, name: highSeed.teamName, logo: highSeed.teamLogo ?? '') : null,
        awayTeam: lowSeed != null ? Team(id: lowSeed.teamId.toString(), externalId: lowSeed.teamId, name: lowSeed.teamName, logo: lowSeed.teamLogo ?? '') : null,
      ));
    }

    return ties;
  }

  /// 2. Oitavas de Final da Champions League (1º-8º Diretos + 8 Vencedores dos Play-offs)
  static List<Tie> generateChampionsRoundOf16(List<Standing> leagueStandings, List<Fixture> r16Fixtures) {
    if (r16Fixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'champions_round_of_16',
        r16Fixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          '1º/2º Fase de Liga x Vencedor Play-off',
          '3º/4º Fase de Liga x Vencedor Play-off',
          '5º/6º Fase de Liga x Vencedor Play-off',
          '7º/8º Fase de Liga x Vencedor Play-off',
          '1º/2º Fase de Liga x Vencedor Play-off',
          '3º/4º Fase de Liga x Vencedor Play-off',
          '5º/6º Fase de Liga x Vencedor Play-off',
          '7º/8º Fase de Liga x Vencedor Play-off',
        ],
      );
    }

    final sorted = List<Standing>.from(leagueStandings);
    final List<Tie> ties = [];

    for (int i = 0; i < 8; i++) {
      final topSeed = i < sorted.length ? sorted[i] : null;
      ties.add(Tie(
        id: 'champions_round_of_16_tie_$i',
        phaseId: 'champions_round_of_16',
        title: 'Oitavas de Final ${i + 1}',
        seedHome: '${i + 1}º Fase de Liga',
        seedAway: 'Vencedor Play-off ${i + 1}',
        homeTeam: topSeed != null ? Team(id: topSeed.teamId.toString(), externalId: topSeed.teamId, name: topSeed.teamName, logo: topSeed.teamLogo ?? '') : null,
      ));
    }

    return ties;
  }

  /// 3. Quartas de Final da Champions League (8 clubes, ida e volta)
  static List<Tie> generateChampionsQuarterFinals(List<Fixture> qfFixtures) {
    if (qfFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'champions_quarter_finals',
        qfFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          'Venc. Oitavas 1 x Venc. Oitavas 2',
          'Venc. Oitavas 3 x Venc. Oitavas 4',
          'Venc. Oitavas 5 x Venc. Oitavas 6',
          'Venc. Oitavas 7 x Venc. Oitavas 8',
        ],
      );
    }

    return List.generate(4, (i) => Tie(
      id: 'champions_quarter_finals_tie_$i',
      phaseId: 'champions_quarter_finals',
      title: 'Quartas de Final ${i + 1}',
      seedHome: 'Vencedor Oitavas ${i * 2 + 1}',
      seedAway: 'Vencedor Oitavas ${i * 2 + 2}',
    ));
  }

  /// 4. Semifinais da Champions League (4 clubes, ida e volta)
  static List<Tie> generateChampionsSemiFinals(List<Fixture> sfFixtures) {
    if (sfFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'champions_semi_finals',
        sfFixtures,
        isTwoLegged: true,
        defaultSeedPairs: const [
          'Venc. Quartas 1 x Venc. Quartas 2',
          'Venc. Quartas 3 x Venc. Quartas 4',
        ],
      );
    }

    return [
      const Tie(
        id: 'champions_semi_finals_tie_0',
        phaseId: 'champions_semi_finals',
        title: 'Semifinal 1',
        seedHome: 'Vencedor Quartas 1',
        seedAway: 'Vencedor Quartas 2',
      ),
      const Tie(
        id: 'champions_semi_finals_tie_1',
        phaseId: 'champions_semi_finals',
        title: 'Semifinal 2',
        seedHome: 'Vencedor Quartas 3',
        seedAway: 'Vencedor Quartas 4',
      ),
    ];
  }

  /// 5. Grande Final da Champions League (2 clubes, jogo único)
  static List<Tie> generateChampionsFinal(List<Fixture> finalFixtures) {
    if (finalFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'champions_final',
        finalFixtures,
        isTwoLegged: false,
        defaultSeedPairs: const ['Vencedor Semifinal 1 x Vencedor Semifinal 2'],
      );
    }

    return [
      const Tie(
        id: 'champions_final_tie_0',
        phaseId: 'champions_final',
        title: 'Grande Final',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
      ),
    ];
  }
}
