import 'model_utils.dart';

class FixtureLineup {
  final String id;
  final String fixtureId;
  final int teamId;
  final String player;
  final int? number;
  final String? pos; // G, D, M, F
  final String? grid;
  final bool isStart;

  FixtureLineup({
    required this.id,
    required this.fixtureId,
    required this.teamId,
    required this.player,
    this.number,
    this.pos,
    this.grid,
    required this.isStart,
  });

  factory FixtureLineup.fromJson(Map<String, dynamic> json) {
    return FixtureLineup(
      id: json['id']?.toString() ?? '',
      fixtureId: json['fixtureId']?.toString() ?? '',
      teamId: toInt(json['teamId']),
      player: json['player']?.toString() ?? '',
      number: json['number'] != null ? toInt(json['number']) : null,
      pos: json['pos'],
      grid: json['grid'],
      isStart: json['isStart'] ?? true,
    );
  }
}
