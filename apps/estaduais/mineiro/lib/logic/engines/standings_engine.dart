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

  /// Divide os 12 clubes do Mineiro Módulo 1 em 3 Grupos de 4 + Classificação Geral:
  /// Grupo A: Atlético-MG, Uberlândia, Democrata GV, URT
  /// Grupo B: América-MG, Tombense, Betim, Pouso Alegre
  /// Grupo C: Cruzeiro, Athletic, Itabirito, North
  static Map<String, List<Standing>> splitMineiroModulo1Groups(
    List<Standing> rawStandings, {
    List<Fixture> fixtures = const [],
  }) {
    final sortedStandings = sortStandings(rawStandings);

    // Mapeamento padrão dos clubes por nome normalizado para o Campeonato Mineiro Módulo I 2026
    bool matchesGroupA(String name) {
      final n = name.toLowerCase();
      return n.contains('atlético') || n.contains('atletico') || n.contains('uberlândia') || n.contains('uberlandia') || (n.contains('democrata') && !n.contains('sl') && !n.contains('sete')) || n.contains('urt');
    }

    bool matchesGroupB(String name) {
      final n = name.toLowerCase();
      return n.contains('américa') || n.contains('america') || n.contains('tombense') || n.contains('betim') || n.contains('pouso alegre');
    }

    bool matchesGroupC(String name) {
      final n = name.toLowerCase();
      return n.contains('cruzeiro') || n.contains('athletic') || n.contains('itabirito') || n.contains('north');
    }

    // 1. Tentar agrupar via propriedade Standing.group da API se estiver preenchida
    final Map<String, List<Standing>> apiGroups = {};
    for (final s in sortedStandings) {
      final g = s.group.trim();
      if (g.isNotEmpty) {
        String cleanG = g;
        if (g.toLowerCase().contains('a') && !g.toLowerCase().contains('b') && !g.toLowerCase().contains('c')) cleanG = 'Grupo A';
        if (g.toLowerCase().contains('b')) cleanG = 'Grupo B';
        if (g.toLowerCase().contains('c')) cleanG = 'Grupo C';
        apiGroups.putIfAbsent(cleanG, () => []).add(s);
      }
    }

    List<Standing> groupA = [];
    List<Standing> groupB = [];
    List<Standing> groupC = [];

    if (apiGroups.containsKey('Grupo A') && apiGroups.containsKey('Grupo B') && apiGroups.containsKey('Grupo C')) {
      groupA = sortStandings(apiGroups['Grupo A']!);
      groupB = sortStandings(apiGroups['Grupo B']!);
      groupC = sortStandings(apiGroups['Grupo C']!);
    } else {
      // 2. Agrupar por correspondência nominal
      for (final s in sortedStandings) {
        if (matchesGroupA(s.teamName) && groupA.length < 4) {
          groupA.add(s);
        } else if (matchesGroupB(s.teamName) && groupB.length < 4) {
          groupB.add(s);
        } else if (matchesGroupC(s.teamName) && groupC.length < 4) {
          groupC.add(s);
        }
      }

      // Preenche eventuais sobras por chunk de 4
      final remaining = sortedStandings.where((s) =>
        !groupA.any((t) => t.teamId == s.teamId) &&
        !groupB.any((t) => t.teamId == s.teamId) &&
        !groupC.any((t) => t.teamId == s.teamId)
      ).toList();

      for (final s in remaining) {
        if (groupA.length < 4) {
          groupA.add(s);
        } else if (groupB.length < 4) {
          groupB.add(s);
        } else if (groupC.length < 4) {
          groupC.add(s);
        }
      }

      groupA = sortStandings(groupA);
      groupB = sortStandings(groupB);
      groupC = sortStandings(groupC);
    }

    return {
      'Grupo A': groupA,
      'Grupo B': groupB,
      'Grupo C': groupC,
      'Classificação Geral': sortedStandings,
    };
  }

  /// Retorna os 4 semifinalistas do Mineiro Módulo I:
  /// - 1º do Grupo A
  /// - 1º do Grupo B
  /// - 1º do Grupo C
  /// - Melhor 2º colocado geral entre os 3 grupos
  /// Ordenados da 1ª à 4ª melhor campanha geral para os confrontos: 1º × 4º e 2º × 3º.
  static List<Standing> getMineiroModulo1SemiFinalists(Map<String, List<Standing>> groupsMap) {
    final gA = groupsMap['Grupo A'] ?? [];
    final gB = groupsMap['Grupo B'] ?? [];
    final gC = groupsMap['Grupo C'] ?? [];

    final List<Standing> leaders = [];
    if (gA.isNotEmpty) leaders.add(gA.first);
    if (gB.isNotEmpty) leaders.add(gB.first);
    if (gC.isNotEmpty) leaders.add(gC.first);

    // Comparar os 2º colocados dos três grupos
    final List<Standing> runnersUp = [];
    if (gA.length > 1) runnersUp.add(gA[1]);
    if (gB.length > 1) runnersUp.add(gB[1]);
    if (gC.length > 1) runnersUp.add(gC[1]);

    final sortedRunnersUp = sortStandings(runnersUp);
    final Standing? bestRunnerUp = sortedRunnersUp.isNotEmpty ? sortedRunnersUp.first : null;

    final List<Standing> semiFinalists = [...leaders];
    if (bestRunnerUp != null && !semiFinalists.any((s) => s.teamId == bestRunnerUp.teamId)) {
      semiFinalists.add(bestRunnerUp);
    }

    // Ordenar os 4 semifinalistas por campanha geral
    return sortStandings(semiFinalists);
  }

  /// Divide os 12 clubes do Mineiro Módulo 2 em 2 Grupos de 6:
  /// Grupo A: Boa, Caldense, Guarani, Mamoré, Patrocinense, Uberaba
  /// Grupo B: Aymorés, Coimbra, Democrata-SL, Ipatinga, Valeriodoce, Villa Nova
  static Map<String, List<Standing>> splitMineiroModulo2Groups(
    List<Standing> rawStandings, {
    List<Fixture> fixtures = const [],
  }) {
    final sortedStandings = sortStandings(rawStandings);

    bool matchesGroupA(String name) {
      final n = name.toLowerCase();
      return n.contains('boa') || n.contains('caldense') || n.contains('guarani') || n.contains('mamoré') || n.contains('mamore') || n.contains('patrocinense') || n.contains('uberaba');
    }

    bool matchesGroupB(String name) {
      final n = name.toLowerCase();
      return n.contains('aymorés') || n.contains('aymores') || n.contains('coimbra') || (n.contains('democrata') && (n.contains('sl') || n.contains('sete'))) || n.contains('ipatinga') || n.contains('valeriodoce') || n.contains('villa nova');
    }

    final Map<String, List<Standing>> apiGroups = {};
    for (final s in sortedStandings) {
      final g = s.group.trim();
      if (g.isNotEmpty) {
        String cleanG = g;
        if (g.toLowerCase().contains('a')) cleanG = 'Grupo A';
        if (g.toLowerCase().contains('b')) cleanG = 'Grupo B';
        apiGroups.putIfAbsent(cleanG, () => []).add(s);
      }
    }

    List<Standing> groupA = [];
    List<Standing> groupB = [];

    if (apiGroups.containsKey('Grupo A') && apiGroups.containsKey('Grupo B')) {
      groupA = sortStandings(apiGroups['Grupo A']!);
      groupB = sortStandings(apiGroups['Grupo B']!);
    } else {
      for (final s in sortedStandings) {
        if (matchesGroupA(s.teamName) && groupA.length < 6) {
          groupA.add(s);
        } else if (matchesGroupB(s.teamName) && groupB.length < 6) {
          groupB.add(s);
        }
      }

      final remaining = sortedStandings.where((s) =>
        !groupA.any((t) => t.teamId == s.teamId) &&
        !groupB.any((t) => t.teamId == s.teamId)
      ).toList();

      for (final s in remaining) {
        if (groupA.length < 6) {
          groupA.add(s);
        } else if (groupB.length < 6) {
          groupB.add(s);
        }
      }

      groupA = sortStandings(groupA);
      groupB = sortStandings(groupB);
    }

    return {
      'Grupo A': groupA,
      'Grupo B': groupB,
    };
  }

  /// Retorna os 8 classificados para as Quartas de Final do Módulo 2:
  /// 4 melhores do Grupo A e 4 melhores do Grupo B.
  static Map<String, List<Standing>> getMineiroModulo2QuarterFinalists(Map<String, List<Standing>> groupsMap) {
    final gA = groupsMap['Grupo A'] ?? [];
    final gB = groupsMap['Grupo B'] ?? [];
    return {
      'Grupo A': gA.take(4).toList(),
      'Grupo B': gB.take(4).toList(),
    };
  }
}
