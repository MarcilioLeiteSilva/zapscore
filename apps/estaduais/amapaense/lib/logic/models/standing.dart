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
      teamId: toInt(teamData?['externalId'] ?? json['teamId']),
      teamName: teamData?['name'] ?? json['teamName'] ?? '',
      teamLogo: teamData?['logo'] ?? json['teamLogo'],
      points: toInt(json['points']),
      played: toInt(json['played'] ?? json['all_played']),
      win: toInt(json['win'] ?? json['all_win']),
      draw: toInt(json['draw'] ?? json['all_draw']),
      lose: toInt(json['lose'] ?? json['all_lose']),
      goalsFor: toInt(json['goalsFor'] ?? json['all_goalsFor']),
      goalsAgainst: toInt(json['goalsAgainst'] ?? json['all_goalsAgainst']),
      goalsDiff: toInt(json['goalsDiff']),
      group: json['group'] ?? '',
      form: json['form'],
      description: json['description'],
    );
  }
}
