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

  /// Gera os 2 confrontos das Semifinais do Mineiro Módulo I (Ida e Volta)
  /// Semifinal 1: 1ª melhor campanha × 4ª melhor campanha
  /// Semifinal 2: 2ª melhor campanha × 3ª melhor campanha
  /// Mando do jogo de volta no clube de melhor campanha. Empate no agregado -> Pênaltis.
  static List<Tie> generateMineiroModulo1SemiFinals(
    List<Standing> qualifiedSemiFinalists,
    List<Fixture> sfFixtures,
  ) {
    if (sfFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'semifinais_modulo1',
        sfFixtures,
        isTwoLegged: true,
        defaultSeedPairs: [
          '1ª Melhor Campanha x 4ª Melhor Campanha',
          '2ª Melhor Campanha x 3ª Melhor Campanha',
        ],
      );

      final limited = builtTies.take(2).toList();
      return [
        for (int i = 0; i < limited.length; i++)
          Tie(
            id: 'sf_m1_$i',
            phaseId: 'semifinais_modulo1',
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

    final top4 = qualifiedSemiFinalists.take(4).toList();

    return [
      Tie(
        id: 'sf_m1_0',
        phaseId: 'semifinais_modulo1',
        title: 'Semifinal 1',
        seedHome: '1ª Melhor Campanha',
        seedAway: '4ª Melhor Campanha',
        homeTeam: top4.isNotEmpty ? teamFromStanding(top4[0]) : null,
        awayTeam: top4.length > 3 ? teamFromStanding(top4[3]) : null,
      ),
      Tie(
        id: 'sf_m1_1',
        phaseId: 'semifinais_modulo1',
        title: 'Semifinal 2',
        seedHome: '2ª Melhor Campanha',
        seedAway: '3ª Melhor Campanha',
        homeTeam: top4.length > 1 ? teamFromStanding(top4[1]) : null,
        awayTeam: top4.length > 2 ? teamFromStanding(top4[2]) : null,
      ),
    ];
  }

  /// Gera a Grande Final do Mineiro Módulo I (Jogo ÚNICO)
  /// Mando definido pela FMF. Empate no tempo normal -> Pênaltis.
  static List<Tie> generateMineiroModulo1Final(
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
        'final_modulo1',
        cleanFinalFixtures,
        isTwoLegged: false, // Jogo Único no Módulo 1 de 2026!
      );
      final t = builtTies.isNotEmpty ? builtTies.first : null;
      if (t != null) {
        return [
          Tie(
            id: 'final_m1_0',
            phaseId: 'final_modulo1',
            title: 'Grande Final',
            homeTeam: t.homeTeam,
            awayTeam: t.awayTeam,
            leg1: t.leg1,
            homeAggregateScore: t.homeAggregateScore,
            awayAggregateScore: t.awayAggregateScore,
            winner: t.winner,
          ),
        ];
      }
    }

    return [
      Tie(
        id: 'final_m1_0',
        phaseId: 'final_modulo1',
        title: 'Grande Final',
        seedHome: 'Finalista 1',
        seedAway: 'Finalista 2',
        homeTeam: winnerOfSf(0),
        awayTeam: winnerOfSf(1),
      ),
    ];
  }

  /// Gera os 4 confrontos das Quartas de Final do Mineiro Módulo II (Ida e Volta)
  /// Cruzamentos: 1ºA × 4ºB | 2ºA × 3ºB | 1ºB × 4ºA | 2ºB × 3ºA
  /// Vantagem: Dois resultados iguais classificam o clube de melhor campanha.
  static List<Tie> generateMineiroModulo2QuarterFinals(
    List<Standing> groupAStandings,
    List<Standing> groupBStandings,
    List<Fixture> qfFixtures,
  ) {
    if (qfFixtures.isNotEmpty) {
      return buildTiesFromFixtures(
        'quartas_modulo2',
        qfFixtures,
        isTwoLegged: true,
        advantageForHigherSeed: true,
        defaultSeedPairs: [
          '1º Grupo A x 4º Grupo B',
          '2º Grupo A x 3º Grupo B',
          '1º Grupo B x 4º Grupo A',
          '2º Grupo B x 3º Grupo A',
        ],
      );
    }

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

    final gA = groupAStandings;
    final gB = groupBStandings;

    final pairs = [
      {'seedH': '1º Grupo A', 'seedA': '4º Grupo B', 'h': gA.isNotEmpty ? gA[0] : null, 'a': gB.length > 3 ? gB[3] : null},
      {'seedH': '2º Grupo A', 'seedA': '3º Grupo B', 'h': gA.length > 1 ? gA[1] : null, 'a': gB.length > 2 ? gB[2] : null},
      {'seedH': '1º Grupo B', 'seedA': '4º Grupo A', 'h': gB.isNotEmpty ? gB[0] : null, 'a': gA.length > 3 ? gA[3] : null},
      {'seedH': '2º Grupo B', 'seedA': '3º Grupo A', 'h': gB.length > 1 ? gB[1] : null, 'a': gA.length > 2 ? gA[2] : null},
    ];

    final List<Tie> theoreticalTies = [];
    for (int i = 0; i < pairs.length; i++) {
      final p = pairs[i];
      theoreticalTies.add(Tie(
        id: 'qf_m2_$i',
        phaseId: 'quartas_modulo2',
        title: 'Quartas de Final ${i + 1}',
        seedHome: p['seedH'] as String,
        seedAway: p['seedA'] as String,
        homeTeam: teamFromStanding(p['h'] as Standing?),
        awayTeam: teamFromStanding(p['a'] as Standing?),
        advantageForHigherSeed: true,
      ));
    }

    return theoreticalTies;
  }

  /// Gera os 2 confrontos das Semifinais do Mineiro Módulo II (Ida e Volta — VALEM O ACESSO AO MÓDULO I)
  /// Vantagem: Dois resultados iguais classificam o clube de melhor campanha.
  static List<Tie> generateMineiroModulo2SemiFinals(
    List<Tie> qfTies,
    List<Fixture> sfFixtures,
  ) {
    if (sfFixtures.isNotEmpty) {
      final builtTies = buildTiesFromFixtures(
        'semifinais_modulo2',
        sfFixtures,
        isTwoLegged: true,
        advantageForHigherSeed: true,
        defaultSeedPairs: [
          'Vencedor QF 1 x Vencedor QF 4',
          'Vencedor QF 2 x Vencedor QF 3',
        ],
      );

      final limited = builtTies.take(2).toList();
      return [
        for (int i = 0; i < limited.length; i++)
          Tie(
            id: 'sf_m2_$i',
            phaseId: 'semifinais_modulo2',
            title: 'Semifinal ${i + 1} (Acesso Módulo I)',
            seedHome: limited[i].seedHome,
            seedAway: limited[i].seedAway,
            homeTeam: limited[i].homeTeam,
            awayTeam: limited[i].awayTeam,
            leg1: limited[i].leg1,
            leg2: limited[i].leg2,
            homeAggregateScore: limited[i].homeAggregateScore,
            awayAggregateScore: limited[i].awayAggregateScore,
            winner: limited[i].winner,
            advantageForHigherSeed: true,
          ),
      ];
    }

    Team? winnerOfQf(int index) {
      if (index < qfTies.length) return qfTies[index].winner;
      return null;
    }

    return [
      Tie(
        id: 'sf_m2_0',
        phaseId: 'semifinais_modulo2',
        title: 'Semifinal 1 (Acesso Módulo I)',
        seedHome: 'Vencedor Quartas 1',
        seedAway: 'Vencedor Quartas 4',
        homeTeam: winnerOfQf(0),
        awayTeam: winnerOfQf(3),
        advantageForHigherSeed: true,
      ),
      Tie(
        id: 'sf_m2_1',
        phaseId: 'semifinais_modulo2',
        title: 'Semifinal 2 (Acesso Módulo I)',
        seedHome: 'Vencedor Quartas 2',
        seedAway: 'Vencedor Quartas 3',
        homeTeam: winnerOfQf(1),
        awayTeam: winnerOfQf(2),
        advantageForHigherSeed: true,
      ),
    ];
  }

  /// Gera a Grande Final do Mineiro Módulo II (Ida e Volta)
  /// Se houver empate no agregado -> Pênaltis (sem vantagem de empate na final).
  static List<Tie> generateMineiroModulo2Final(
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
        'final_modulo2',
        cleanFinalFixtures,
        isTwoLegged: true,
        advantageForHigherSeed: false, // Na final não há vantagem por empate
      );
      final t = builtTies.isNotEmpty ? builtTies.first : null;
      if (t != null) {
        return [
          Tie(
            id: 'final_m2_0',
            phaseId: 'final_modulo2',
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
        id: 'final_m2_0',
        phaseId: 'final_modulo2',
        title: 'Grande Final',
        seedHome: 'Finalista 1 (Promovido Módulo I)',
        seedAway: 'Finalista 2 (Promovido Módulo I)',
        homeTeam: winnerOfSf(0),
        awayTeam: winnerOfSf(1),
      ),
    ];
  }
}
