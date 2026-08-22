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
            // Identificar quem foi mandante no jogo 1 por data
            if (f2.date.isBefore(f1.date)) {
              leg1 = f2;
              leg2 = f1;
            } else {
              leg2 = f2;
            }
            break;
          }
        }

        // Calcular Placar Agregado
        int? homeAgg;
        int? awayAgg;
        Team? winner;

        final homeTeam = leg1.homeTeam;
        final awayTeam = leg1.awayTeam;

        if (leg1.homeGoals != null && leg1.awayGoals != null) {
          homeAgg = leg1.homeGoals!;
          awayAgg = leg1.awayGoals!;

          if (leg2 != null && leg2.homeGoals != null && leg2.awayGoals != null) {
            // leg2 home é o away do leg1
            if (leg2.homeTeam?.externalId == awayTeam?.externalId) {
              awayAgg += leg2.homeGoals!;
              homeAgg += leg2.awayGoals!;
            } else {
              homeAgg += leg2.homeGoals!;
              awayAgg += leg2.awayGoals!;
            }

            if (leg1.statusShort == 'FT' && leg2.statusShort == 'FT') {
              if (homeAgg > awayAgg) {
                winner = homeTeam;
              } else if (awayAgg > homeAgg) {
                winner = awayTeam;
              } else {
                if (advantageForHigherSeed) {
                  winner = homeTeam; // Vantagem do melhor colocado
                }
              }
            }
          }
        }

        String title = 'Confronto ${ties.length + 1}';
        if (phaseId.contains('final') && !phaseId.contains('semi') && !phaseId.contains('quarter')) {
          title = 'Grande Final';
        } else if (phaseId.contains('semi')) {
          title = 'Semifinal ${ties.length + 1}';
        }

        ties.add(Tie(
          id: '${phaseId}_tie_${ties.length}',
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

  /// Gera os 4 confrontos oficiais das Quartas de Final do Carioca A1 a partir dos classificados
  /// 1º Grupo A × 4º Grupo A
  /// 2º Grupo A × 3º Grupo A
  /// 1º Grupo B × 4º Grupo B
  /// 2º Grupo B × 3º Grupo B
  static List<Tie> generateCariocaA1QuarterFinals(
    List<Standing> groupAStandings,
    List<Standing> groupBStandings,
    List<Fixture> qfFixtures,
  ) {
    if (qfFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quarter_finals_a1',
        qfFixtures,
        isTwoLegged: false,
        defaultSeedPairs: [
          '1º Grupo A x 4º Grupo A',
          '2º Grupo A x 3º Grupo A',
          '1º Grupo B x 4º Grupo B',
          '2º Grupo B x 3º Grupo B',
        ],
      );
    }

    // Se ainda não houver fixtures na API, gera os pares teóricos com os clubes na tabela
    final List<Tie> theoreticalTies = [];

    Team? teamFromStanding(Standing? s) {
      if (s == null) return null;
      return Team(
        id: s.teamId.toString(),
        externalId: s.teamId,
        name: s.teamName,
        logo: s.teamLogo,
        country: 'Brazil',
      );
    }

    final sA = groupAStandings;
    final sB = groupBStandings;

    final pairs = [
      {'seedH': '1º Grupo A', 'seedA': '4º Grupo A', 'h': sA.isNotEmpty ? sA[0] : null, 'a': sA.length > 3 ? sA[3] : null},
      {'seedH': '2º Grupo A', 'seedA': '3º Grupo A', 'h': sA.length > 1 ? sA[1] : null, 'a': sA.length > 2 ? sA[2] : null},
      {'seedH': '1º Grupo B', 'seedA': '4º Grupo B', 'h': sB.isNotEmpty ? sB[0] : null, 'a': sB.length > 3 ? sB[3] : null},
      {'seedH': '2º Grupo B', 'seedA': '3º Grupo B', 'h': sB.length > 1 ? sB[1] : null, 'a': sB.length > 2 ? sB[2] : null},
    ];

    for (int i = 0; i < pairs.length; i++) {
      final p = pairs[i];
      theoreticalTies.add(Tie(
        id: 'qf_a1_$i',
        phaseId: 'quarter_finals_a1',
        title: 'Quartas de Final ${i + 1}',
        seedHome: p['seedH'] as String,
        seedAway: p['seedA'] as String,
        homeTeam: teamFromStanding(p['h'] as Standing?),
        awayTeam: teamFromStanding(p['a'] as Standing?),
      ));
    }

    return theoreticalTies;
  }

  /// Gera os 2 confrontos das Semifinais da Série A1 — EXATAMENTE 2 ties
  /// Semifinal 1: Vencedor QF1 × Vencedor QF4 (ida e volta)
  /// Semifinal 2: Vencedor QF2 × Vencedor QF3 (ida e volta)
  static List<Tie> generateCariocaA1SemiFinals(
    List<Tie> qfTies,
    List<Fixture> sfFixtures,
  ) {
    if (sfFixtures.isNotEmpty) {
      // Agrupa os fixtures em pares (ida + volta) por pairKey de times
      final builtTies = buildTiesFromFixtures(
        'semi_finals_a1',
        sfFixtures,
        isTwoLegged: true,
      );

      // Garante exatamente 2 ties, renomeados como Semifinal 1 e Semifinal 2
      final limited = builtTies.take(2).toList();
      return [
        for (int i = 0; i < limited.length; i++)
          Tie(
            id: 'sf_a1_$i',
            phaseId: 'semi_finals_a1',
            title: 'Semifinal ${i + 1}',
            seedHome: limited[i].seedHome,
            seedAway: limited[i].seedAway,
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
        id: 'sf_a1_0',
        phaseId: 'semi_finals_a1',
        title: 'Semifinal 1',
        seedHome: 'Vencedor Quartas 1',
        seedAway: 'Vencedor Quartas 4',
        homeTeam: winnerOfQf(0),
        awayTeam: winnerOfQf(3),
      ),
      Tie(
        id: 'sf_a1_1',
        phaseId: 'semi_finals_a1',
        title: 'Semifinal 2',
        seedHome: 'Vencedor Quartas 2',
        seedAway: 'Vencedor Quartas 3',
        homeTeam: winnerOfQf(1),
        awayTeam: winnerOfQf(2),
      ),
    ];
  }

  /// Gera a Grande Final da Série A1 — EXATAMENTE 1 tie, 2 vencedores das Semis (sem 3º/4º)
  static List<Tie> generateCariocaA1Final(
    List<Tie> sfTies,
    List<Fixture> finalFixtures,
  ) {
    final cleanFinalFixtures = finalFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return !r.contains('3rd') && !r.contains('third') && !r.contains('terceiro');
    }).toList();

    Team? winnerOfSf(int index) {
      if (index < sfTies.length) return sfTies[index].winner;
      return null;
    }

    if (cleanFinalFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'final_a1',
        cleanFinalFixtures,
        isTwoLegged: false,
      );
      // Pega só o 1º tie (a final real), ignora disputa de 3º lugar
      final t = builtTies.isNotEmpty ? builtTies.first : null;
      if (t != null) {
        return [
          Tie(
            id: 'final_a1_0',
            phaseId: 'final_a1',
            title: 'Grande Final',
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
        title: 'Grande Final',
        seedHome: 'Vencedor Semifinal 1',
        seedAway: 'Vencedor Semifinal 2',
        homeTeam: winnerOfSf(0),
        awayTeam: winnerOfSf(1),
      ),
    ];
  }
}
