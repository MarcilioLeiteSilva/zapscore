import 'model_utils.dart';

class RecentAudit {
  final String fixtureId;
  final String homeTeam;
  final String? homeTeamLogo;
  final String awayTeam;
  final String? awayTeamLogo;
  final String score;
  final String? predicted;
  final bool? isHit;
  final DateTime date;
  final String leagueName;

  RecentAudit({
    required this.fixtureId,
    required this.homeTeam,
    this.homeTeamLogo,
    required this.awayTeam,
    this.awayTeamLogo,
    required this.score,
    this.predicted,
    this.isHit,
    required this.date,
    required this.leagueName,
  });

  factory RecentAudit.fromJson(Map<String, dynamic> json) {
    return RecentAudit(
      fixtureId: json['fixtureId']?.toString() ?? '',
      homeTeam: json['homeTeam']?.toString() ?? '',
      homeTeamLogo: json['homeTeamLogo']?.toString(),
      awayTeam: json['awayTeam']?.toString() ?? '',
      awayTeamLogo: json['awayTeamLogo']?.toString(),
      score: json['score']?.toString() ?? '0-0',
      predicted: json['predicted']?.toString(),
      isHit: json['isHit'] as bool?,
      date: json['date'] != null ? DateTime.parse(json['date']).toLocal() : DateTime.now(),
      leagueName: json['leagueName']?.toString() ?? '',
    );
  }
}

class AiPerformanceStats {
  final int totalGames;
  final int hits;
  final int misses;
  final double accuracyPercentage;
  final List<RecentAudit> recentAudits;

  AiPerformanceStats({
    required this.totalGames,
    required this.hits,
    required this.misses,
    required this.accuracyPercentage,
    required this.recentAudits,
  });

  factory AiPerformanceStats.fromJson(Map<String, dynamic> json) {
    final list = json['recentAudits'] as List?;
    return AiPerformanceStats(
      totalGames: toInt(json['totalGames']),
      hits: toInt(json['hits']),
      misses: toInt(json['misses']),
      accuracyPercentage: toDouble(json['accuracyPercentage']),
      recentAudits: list != null
          ? list.map((item) => RecentAudit.fromJson(item)).toList()
          : [],
    );
  }
}
