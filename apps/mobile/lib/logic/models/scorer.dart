import 'model_utils.dart';

class Scorer {
  final int rank;
  final String playerName;
  final String? playerPhoto;
  final String teamName;
  final String? teamLogo;
  final int goals;
  final int assists;

  Scorer({
    required this.rank,
    required this.playerName,
    this.playerPhoto,
    required this.teamName,
    this.teamLogo,
    required this.goals,
    required this.assists,
  });

  factory Scorer.fromJson(Map<String, dynamic> json) {
    final player = json['player'] as Map<String, dynamic>?;
    final statsList = json['statistics'] as List<dynamic>?;
    final stats = statsList != null && statsList.isNotEmpty
        ? statsList[0] as Map<String, dynamic>?
        : null;
    final team = stats?['team'] as Map<String, dynamic>?;
    final goals = stats?['goals'] as Map<String, dynamic>?;

    return Scorer(
      rank: 0, // API doesn't provide rank directly, we can assign it in the Cubit or list
      playerName: player?['name'] ?? '',
      playerPhoto: player?['photo'],
      teamName: team?['name'] ?? '',
      teamLogo: team?['logo'],
      goals: toInt(goals?['total']),
      assists: toInt(goals?['assists']),
    );
  }
}
