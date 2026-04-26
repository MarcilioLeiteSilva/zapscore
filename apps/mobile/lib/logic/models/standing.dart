import 'model_utils.dart';

class Standing {
  final int rank;
  final int teamId;
  final String teamName;
  final String? teamLogo;
  final int points;
  final int played;
  final int win;
  final int draw;
  final int lose;
  final int goalsFor;
  final int goalsAgainst;
  final int goalsDiff;
  final String group;
  final String? form;
  final String? description;

  Standing({
    required this.rank,
    required this.teamId,
    required this.teamName,
    this.teamLogo,
    required this.points,
    required this.played,
    required this.win,
    required this.draw,
    required this.lose,
    required this.goalsFor,
    required this.goalsAgainst,
    required this.goalsDiff,
    required this.group,
    this.form,
    this.description,
  });

  factory Standing.fromJson(Map<String, dynamic> json) {
    final teamData = json['team'] as Map<String, dynamic>?;
    return Standing(
      rank: toInt(json['rank']),
      teamId: toInt(json['teamId']),
      teamName: teamData?['name'] ?? '',
      teamLogo: teamData?['logo'],
      points: toInt(json['points']),
      played: toInt(json['all_played']),
      win: toInt(json['all_win']),
      draw: toInt(json['all_draw']),
      lose: toInt(json['all_lose']),
      goalsFor: toInt(json['all_goalsFor']),
      goalsAgainst: toInt(json['all_goalsAgainst']),
      goalsDiff: toInt(json['goalsDiff']),
      group: json['group'] ?? '',
      form: json['form'],
      description: json['description'],
    );
  }
}
