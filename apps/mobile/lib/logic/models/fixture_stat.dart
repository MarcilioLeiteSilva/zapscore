import 'model_utils.dart';

class FixtureStat {
  final String id;
  final String fixtureId;
  final int teamId;
  final String type; // Shots on Goal, Possession, Corners, Fouls...
  final String? value;

  FixtureStat({
    required this.id,
    required this.fixtureId,
    required this.teamId,
    required this.type,
    this.value,
  });

  factory FixtureStat.fromJson(Map<String, dynamic> json) {
    return FixtureStat(
      id: json['id']?.toString() ?? '',
      fixtureId: json['fixtureId']?.toString() ?? '',
      teamId: toInt(json['teamId']),
      type: json['type']?.toString() ?? '',
      value: json['value']?.toString(),
    );
  }
}
