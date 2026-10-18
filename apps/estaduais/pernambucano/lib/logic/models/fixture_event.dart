import 'model_utils.dart';

class FixtureEvent {
  final String id;
  final String fixtureId;
  final int time;
  final int teamId;
  final int? playerId;
  final String? player;
  final String? playerPhoto;
  final String? assist;
  final String type; // Goal, Card, Subst, Var
  final String? detail;
  final int? externalPlayerId;

  FixtureEvent({
    required this.id,
    required this.fixtureId,
    required this.time,
    required this.teamId,
    this.playerId,
    this.player,
    this.playerPhoto,
    this.assist,
    required this.type,
    this.detail,
    this.externalPlayerId,
  });

  factory FixtureEvent.fromJson(Map<String, dynamic> json) {
    String? playerName;
    String? photo;
    int? extPlayerId;
    
    if (json['player'] is Map) {
      final playerMap = json['player'] as Map<String, dynamic>;
      playerName = playerMap['name']?.toString();
      photo = playerMap['photo']?.toString();
      extPlayerId = playerMap['id'] != null ? toInt(playerMap['id']) : null;
    } else {
      playerName = json['player']?.toString();
    }

    // Se a foto for uma string vazia, trata como null
    if (photo != null && photo.isEmpty) photo = null;

    return FixtureEvent(
      id: json['id']?.toString() ?? '',
      fixtureId: json['fixtureId']?.toString() ?? '',
      time: toInt(json['time']),
      teamId: toInt(json['teamId']),
      playerId: extPlayerId ?? (json['playerId'] != null ? toInt(json['playerId']) : null),
      externalPlayerId: extPlayerId ?? (json['externalPlayerId'] != null ? toInt(json['externalPlayerId']) : null),
      player: playerName,
      playerPhoto: (json['playerPhoto']?.toString().isNotEmpty == true ? json['playerPhoto'] : null) ?? 
                   (json['photo']?.toString().isNotEmpty == true ? json['photo'] : null) ?? 
                   photo,
      assist: json['assist'],
      type: json['type']?.toString() ?? '',
      detail: json['detail'],
    );
  }
}
