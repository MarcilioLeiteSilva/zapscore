import '../models/standing.dart';
import '../models/fixture.dart';

class StandingsEngine {
  /// Ordena standings aplicando critérios oficiais da UEFA Champions League (Fase de Liga):
  /// 1. Pontos
  /// 2. Saldo de Gols
  /// 3. Gols Pró (Marcados)
  /// 4. Vitórias
  /// 5. Ordem Alfabética / Sorteio
  static List<Standing> sortStandings(List<Standing> items) {
    final list = List<Standing>.from(items);
    list.sort((a, b) {
      if (a.points != b.points) return b.points.compareTo(a.points);
      if (a.goalsDiff != b.goalsDiff) return b.goalsDiff.compareTo(a.goalsDiff);
      if (a.goalsFor != b.goalsFor) return b.goalsFor.compareTo(a.goalsFor);
      if (a.win != b.win) return b.win.compareTo(a.win);
      return a.teamName.compareTo(b.teamName);
    });

    // Reatribuir ranks ordenados de 1 a N e definir zona da tabela UEFA
    return List.generate(list.length, (index) {
      final s = list[index];
      final rank = index + 1;

      String desc = '';
      if (rank <= 8) {
        desc = 'Oitavas de Final (Direto)';
      } else if (rank <= 24) {
        desc = 'Play-off Eliminatório';
      } else {
        desc = 'Eliminado';
      }

      return Standing(
        rank: rank,
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
        group: s.group.isNotEmpty ? s.group : 'Fase de Liga',
        form: s.form,
        description: s.description?.isNotEmpty == true ? s.description : desc,
      );
    });
  }

  /// Calcula a classificação a partir de uma lista de partidas finalizadas
  static List<Standing> calculateStandingsFromFixtures(List<Fixture> fixtures, {String group = 'Fase de Liga'}) {
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
}
