import 'model_utils.dart';

class SquadPlayer {
  final int id;
  final String name;
  final int? age;
  final int? number;
  final String? position;
  final String? photo;

  SquadPlayer({
    required this.id,
    required this.name,
    this.age,
    this.number,
    this.position,
    this.photo,
  });

  factory SquadPlayer.fromJson(Map<String, dynamic> json) {
    return SquadPlayer(
      id: toInt(json['id']),
      name: json['name'] ?? '',
      age: json['age'] != null ? toInt(json['age']) : null,
      number: json['number'] != null ? toInt(json['number']) : null,
      position: json['position'],
      photo: json['photo'],
    );
  }
}
