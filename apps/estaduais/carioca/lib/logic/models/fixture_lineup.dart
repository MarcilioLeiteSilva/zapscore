import 'model_utils.dart';

class FixtureLineup {
  final String id;
  final String fixtureId;
  final int teamId;
  final String player;
  final int? externalPlayerId;
  final int? number;
  final String? pos; // G, D, M, F
  final String? grid;
  final bool isStart;
  final String? playerPhoto;

  FixtureLineup({
    required this.id,
    required this.fixtureId,
    required this.teamId,
    required this.player,
    this.externalPlayerId,
    this.number,
    this.pos,
    this.grid,
    required this.isStart,
    this.playerPhoto,
  });

  factory FixtureLineup.fromJson(Map<String, dynamic> json) {
    String playerName = '';
    String? photo;
    int? externalId;
    
    if (json['player'] is Map) {
      final playerMap = json['player'] as Map<String, dynamic>;
      playerName = playerMap['name']?.toString() ?? '';
      photo = playerMap['photo']?.toString();
      externalId = playerMap['id'] != null ? toInt(playerMap['id']) : null;
    } else {
      playerName = json['player']?.toString() ?? '';
    }

    // Se a foto for uma string vazia, trata como null
    if (photo != null && photo.isEmpty) photo = null;

    return FixtureLineup(
      id: json['id']?.toString() ?? '',
      fixtureId: json['fixtureId']?.toString() ?? '',
      teamId: toInt(json['teamId']),
      player: playerName,
      externalPlayerId: externalId ?? (json['externalPlayerId'] != null ? toInt(json['externalPlayerId']) : null),
      number: json['number'] != null ? toInt(json['number']) : null,
      pos: json['pos'],
      grid: json['grid'],
      isStart: json['isStart'] ?? true,
      playerPhoto: (json['playerPhoto']?.toString().isNotEmpty == true ? json['playerPhoto'] : null) ?? 
                   (json['photo']?.toString().isNotEmpty == true ? json['photo'] : null) ?? 
                   photo,
    );
  }
}
