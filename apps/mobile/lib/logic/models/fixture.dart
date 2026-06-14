import 'team.dart';
import 'league.dart';
import 'model_utils.dart';
import 'fixture_event.dart';
import 'fixture_stat.dart';
import 'fixture_lineup.dart';

export 'fixture_event.dart';
export 'fixture_stat.dart';
export 'fixture_lineup.dart';

class Fixture {
  final String id;
  final int externalId;
  final String leagueId;
  final int season;
  final DateTime date;
  final String? round;
  final String? statusLong;
  final String? statusShort;
  final int? elapsed;
  final String? venueName;
  final String? venueCity;
  final String homeTeamId;
  final String awayTeamId;
  final int? homeGoals;
  final int? awayGoals;
  
  final Team? homeTeam;
  final Team? awayTeam;
  final League? league;

  final List<FixtureEvent> events;
  final List<FixtureStat> stats;
  final List<FixtureLineup> lineups;

  // AI analysis audit fields
  final String? aiPredictedResult;
  final bool? aiIsHit;
  final Map<String, dynamic>? aiTipsStatus;

  Fixture({
    required this.id,
    required this.externalId,
    required this.leagueId,
    required this.season,
    required this.date,
    this.round,
    this.statusLong,
    this.statusShort,
    this.elapsed,
    this.venueName,
    this.venueCity,
    required this.homeTeamId,
    required this.awayTeamId,
    this.homeGoals,
    this.awayGoals,
    this.homeTeam,
    this.awayTeam,
    this.league,
    this.events = const [],
    this.stats = const [],
    this.lineups = const [],
    this.aiPredictedResult,
    this.aiIsHit,
    this.aiTipsStatus,
  });

  bool get isFinished => statusShort == 'FT' || statusShort == 'AET' || statusShort == 'PEN';

  factory Fixture.dummy() {
    return Fixture(
      id: '',
      externalId: 0,
      leagueId: '',
      season: 2026,
      date: DateTime.now(),
      homeTeamId: '',
      awayTeamId: '',
    );
  }

  factory Fixture.fromJson(Map<String, dynamic> json) {
    return Fixture(
      id: json['id']?.toString() ?? '',
      externalId: toInt(json['externalId']),
      leagueId: json['leagueId']?.toString() ?? '',
      season: toInt(json['season']),
      date: json['date'] != null ? DateTime.parse(json['date']).toLocal() : DateTime.now(),
      round: json['round'],
      statusLong: json['statusLong'],
      statusShort: json['statusShort'],
      elapsed: json['elapsed'] != null ? toInt(json['elapsed']) : null,
      venueName: json['venueName'],
      venueCity: json['venueCity'],
      homeTeamId: json['homeTeamId']?.toString() ?? '',
      awayTeamId: json['awayTeamId']?.toString() ?? '',
      homeGoals: json['homeGoals'] != null ? toInt(json['homeGoals']) : null,
      awayGoals: json['awayGoals'] != null ? toInt(json['awayGoals']) : null,
      homeTeam: json['homeTeam'] != null ? Team.fromJson(json['homeTeam']) : null,
      awayTeam: json['awayTeam'] != null ? Team.fromJson(json['awayTeam']) : null,
      league: json['league'] != null ? League.fromJson(json['league']) : null,
      events: json['events'] != null
          ? (json['events'] as List).map((e) => FixtureEvent.fromJson(e)).toList()
          : [],
      stats: json['stats'] != null
          ? (json['stats'] as List).map((e) => FixtureStat.fromJson(e)).toList()
          : [],
      lineups: json['lineups'] != null
          ? (json['lineups'] as List).map((e) => FixtureLineup.fromJson(e)).toList()
          : [],
      aiPredictedResult: json['aiAnalysis']?['predictedResult']?.toString(),
      aiIsHit: json['aiAnalysis']?['isHit'] as bool?,
      aiTipsStatus: json['aiAnalysis']?['tipsStatus'] is Map<String, dynamic>
          ? json['aiAnalysis']?['tipsStatus'] as Map<String, dynamic>
          : null,
    );
  }
}
