import '../models/standing.dart';
import '../models/fixture.dart';
import '../models/competition_phase.dart';

class StandingsEngine {
  /// Ordena standings aplicando critérios padrão ou customizados:
  /// 1. Pontos
  /// 2. Vitórias
  /// 3. Saldo de Gols
  /// 4. Gols Pró
  /// 5. Menos Cartões / Sorteio (Ordem de Entrada)
  static List<Standing> sortStandings(List<Standing> items) {
    final list = List<Standing>.from(items);
    list.sort((a, b) {
      if (a.points != b.points) return b.points.compareTo(a.points);
      if (a.win != b.win) return b.win.compareTo(a.win);
      if (a.goalsDiff != b.goalsDiff) return b.goalsDiff.compareTo(a.goalsDiff);
      if (a.goalsFor != b.goalsFor) return b.goalsFor.compareTo(a.goalsFor);
      return a.teamName.compareTo(b.teamName);
    });

    // Reatribuir ranks ordenados de 1 a N
    return List.generate(list.length, (index) {
      final s = list[index];
      return Standing(
        rank: index + 1,
        teamId: s.teamId,
        teamName: s.teamName,
        teamLogo: s.teamLogo,
        points: s.points,
        played: s.played,
        win: s.win,
        draw: s.draw,
        lose: s.lose,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalsDiff: s.goalsDiff,
        group: s.group,
        form: s.form,
        description: s.description,
      );
    });
  }

  /// Calcula a classificação a partir de uma lista de partidas finalizadas
  static List<Standing> calculateStandingsFromFixtures(List<Fixture> fixtures, {String group = ''}) {
    final Map<int, Map<String, dynamic>> stats = {};

    for (final f in fixtures) {
      if (f.statusShort != 'FT' && f.statusShort != 'AET' && f.statusShort != 'PEN') continue;
      if (f.homeTeam == null || f.awayTeam == null) continue;
      if (f.homeGoals == null || f.awayGoals == null) continue;

      final hId = f.homeTeam!.externalId > 0 ? f.homeTeam!.externalId : (int.tryParse(f.homeTeam!.id) ?? 0);
      final aId = f.awayTeam!.externalId > 0 ? f.awayTeam!.externalId : (int.tryParse(f.awayTeam!.id) ?? 0);

      stats.putIfAbsent(hId, () => {
        'id': hId,
        'name': f.homeTeam!.name,
        'logo': f.homeTeam!.logo,
        'played': 0, 'win': 0, 'draw': 0, 'lose': 0,
        'goalsFor': 0, 'goalsAgainst': 0, 'points': 0,
      });

      stats.putIfAbsent(aId, () => {
        'id': aId,
        'name': f.awayTeam!.name,
        'logo': f.awayTeam!.logo,
        'played': 0, 'win': 0, 'draw': 0, 'lose': 0,
        'goalsFor': 0, 'goalsAgainst': 0, 'points': 0,
      });

      final hStat = stats[hId]!;
      final aStat = stats[aId]!;

      hStat['played'] = (hStat['played'] as int) + 1;
      aStat['played'] = (aStat['played'] as int) + 1;

      final hG = f.homeGoals!;
      final aG = f.awayGoals!;

      hStat['goalsFor'] = (hStat['goalsFor'] as int) + hG;
      hStat['goalsAgainst'] = (hStat['goalsAgainst'] as int) + aG;
      aStat['goalsFor'] = (aStat['goalsFor'] as int) + aG;
      aStat['goalsAgainst'] = (aStat['goalsAgainst'] as int) + hG;

      if (hG > aG) {
        hStat['win'] = (hStat['win'] as int) + 1;
        hStat['points'] = (hStat['points'] as int) + 3;
        aStat['lose'] = (aStat['lose'] as int) + 1;
      } else if (aG > hG) {
        aStat['win'] = (aStat['win'] as int) + 1;
        aStat['points'] = (aStat['points'] as int) + 3;
        hStat['lose'] = (hStat['lose'] as int) + 1;
      } else {
        hStat['draw'] = (hStat['draw'] as int) + 1;
        hStat['points'] = (hStat['points'] as int) + 1;
        aStat['draw'] = (aStat['draw'] as int) + 1;
        aStat['points'] = (aStat['points'] as int) + 1;
      }
    }

    final standings = stats.values.map((s) {
      final gf = s['goalsFor'] as int;
      final ga = s['goalsAgainst'] as int;
      return Standing(
        rank: 0,
        teamId: s['id'] as int,
        teamName: s['name'] as String,
        teamLogo: s['logo'] as String?,
        points: s['points'] as int,
        played: s['played'] as int,
        win: s['win'] as int,
        draw: s['draw'] as int,
        lose: s['lose'] as int,
        goalsFor: gf,
        goalsAgainst: ga,
        goalsDiff: gf - ga,
        group: group,
      );
    }).toList();

    return sortStandings(standings);
  }

  /// Divide os 8 melhores da 1ª Fase da Série A2 nos Grupos do Quadrangular:
  /// Grupo 2: 1º, 3º, 6º e 8º colocados
  /// Grupo 3: 2º, 4º, 5º e 7º colocados
  static Map<String, List<Standing>> splitPaulistaA2Quadrangular(
    List<Standing> firstPhaseStandings, {
    List<Fixture> quadrangularFixtures = const [],
  }) {
    final sortedFirstPhase = sortStandings(firstPhaseStandings);
    final top8 = sortedFirstPhase.take(8).toList();

    // Clubes designados para o Grupo 2 (Índices 0, 2, 5, 7 -> 1º, 3º, 6º, 8º)
    final List<Standing> seededGroup2 = [];
    if (top8.isNotEmpty) seededGroup2.add(top8[0]);
    if (top8.length > 2) seededGroup2.add(top8[2]);
    if (top8.length > 5) seededGroup2.add(top8[5]);
    if (top8.length > 7) seededGroup2.add(top8[7]);

    // Clubes designados para o Grupo 3 (Índices 1, 3, 4, 6 -> 2º, 4º, 5º, 7º)
    final List<Standing> seededGroup3 = [];
    if (top8.length > 1) seededGroup3.add(top8[1]);
    if (top8.length > 3) seededGroup3.add(top8[3]);
    if (top8.length > 4) seededGroup3.add(top8[4]);
    if (top8.length > 6) seededGroup3.add(top8[6]);

    final g2TeamIds = seededGroup2.map((s) => s.teamId).toSet();
    final g3TeamIds = seededGroup3.map((s) => s.teamId).toSet();

    // Se houver partidas disputadas do quadrangular, calcula a tabela com base nos jogos
    if (quadrangularFixtures.any((f) => f.statusShort == 'FT' || f.statusShort == 'AET' || f.statusShort == 'PEN')) {
      final g2Fixtures = quadrangularFixtures.where((f) {
        final hId = f.homeTeam?.externalId ?? (int.tryParse(f.homeTeam?.id ?? '') ?? 0);
        final aId = f.awayTeam?.externalId ?? (int.tryParse(f.awayTeam?.id ?? '') ?? 0);
        return g2TeamIds.contains(hId) && g2TeamIds.contains(aId);
      }).toList();

      final g3Fixtures = quadrangularFixtures.where((f) {
        final hId = f.homeTeam?.externalId ?? (int.tryParse(f.homeTeam?.id ?? '') ?? 0);
        final aId = f.awayTeam?.externalId ?? (int.tryParse(f.awayTeam?.id ?? '') ?? 0);
        return g3TeamIds.contains(hId) && g3TeamIds.contains(aId);
      }).toList();

      final g2Standings = calculateStandingsFromFixtures(g2Fixtures, group: 'Grupo 2');
      final g3Standings = calculateStandingsFromFixtures(g3Fixtures, group: 'Grupo 3');

      // Preenche times que ainda não pontuaram
      for (var s in seededGroup2) {
        if (!g2Standings.any((st) => st.teamId == s.teamId)) {
          g2Standings.add(Standing(
            rank: 0,
            teamId: s.teamId,
            teamName: s.teamName,
            teamLogo: s.teamLogo,
            points: 0,
            played: 0,
            win: 0,
            draw: 0,
            lose: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalsDiff: 0,
            group: 'Grupo 2',
          ));
        }
      }
      for (var s in seededGroup3) {
        if (!g3Standings.any((st) => st.teamId == s.teamId)) {
          g3Standings.add(Standing(
            rank: 0,
            teamId: s.teamId,
            teamName: s.teamName,
            teamLogo: s.teamLogo,
            points: 0,
            played: 0,
            win: 0,
            draw: 0,
            lose: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalsDiff: 0,
            group: 'Grupo 3',
          ));
        }
      }

      return {
        'Grupo 2': sortStandings(g2Standings),
        'Grupo 3': sortStandings(g3Standings),
      };
    }

    // Inicialização zerada dos grupos com os times classificados
    final initG2 = seededGroup2.map((s) => Standing(
      rank: 0,
      teamId: s.teamId,
      teamName: s.teamName,
      teamLogo: s.teamLogo,
      points: 0, played: 0, win: 0, draw: 0, lose: 0,
      goalsFor: 0, goalsAgainst: 0, goalsDiff: 0,
      group: 'Grupo 2',
    )).toList();

    final initG3 = seededGroup3.map((s) => Standing(
      rank: 0,
      teamId: s.teamId,
      teamName: s.teamName,
      teamLogo: s.teamLogo,
      points: 0, played: 0, win: 0, draw: 0, lose: 0,
      goalsFor: 0, goalsAgainst: 0, goalsDiff: 0,
      group: 'Grupo 3',
    )).toList();

    return {
      'Grupo 2': sortStandings(initG2),
      'Grupo 3': sortStandings(initG3),
    };
  }
}
