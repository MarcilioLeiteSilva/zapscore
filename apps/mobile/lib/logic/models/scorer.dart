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
    return Scorer(
      rank: toInt(json['rank']),
      playerName: json['playerName'] ?? json['player']?['name'] ?? '',
      playerPhoto: json['playerPhoto'] ?? json['player']?['photo'],
      teamName: json['teamName'] ?? json['statistics']?[0]?['team']?['name'] ?? '',
      teamLogo: json['teamLogo'] ?? json['statistics']?[0]?['team']?['logo'],
      goals: toInt(json['goals'] ?? json['statistics']?[0]?['goals']?['total']),
      assists: toInt(json['assists'] ?? json['statistics']?[0]?['goals']?['assists']),
    );
  }
}
