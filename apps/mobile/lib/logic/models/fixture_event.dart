import 'model_utils.dart';

class FixtureEvent {
  final String id;
  final String fixtureId;
  final int time;
  final int teamId;
  final String? player;
  final String? assist;
  final String type; // Goal, Card, Subst, Var
  final String? detail;

  FixtureEvent({
    required this.id,
    required this.fixtureId,
    required this.time,
    required this.teamId,
    this.player,
    this.assist,
    required this.type,
    this.detail,
  });

  factory FixtureEvent.fromJson(Map<String, dynamic> json) {
    return FixtureEvent(
      id: json['id']?.toString() ?? '',
      fixtureId: json['fixtureId']?.toString() ?? '',
      time: toInt(json['time']),
      teamId: toInt(json['teamId']),
      player: json['player'],
      assist: json['assist'],
      type: json['type']?.toString() ?? '',
      detail: json['detail'],
    );
  }
}
