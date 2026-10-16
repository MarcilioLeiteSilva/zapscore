import 'model_utils.dart';

class PlayerProfile {
  final String id;
  final int externalId;
  final String name;
  final String? firstname;
  final String? lastname;
  final int? age;
  final String? birthDate;
  final String? birthPlace;
  final String? birthCountry;
  final String? nationality;
  final String? height;
  final String? weight;
  final bool injured;
  final String? photo;
  final List<dynamic> statistics;

  PlayerProfile({
    required this.id,
    required this.externalId,
    required this.name,
    this.firstname,
    this.lastname,
    this.age,
    this.birthDate,
    this.birthPlace,
    this.birthCountry,
    this.nationality,
    this.height,
    this.weight,
    required this.injured,
    this.photo,
    this.statistics = const [],
  });

  factory PlayerProfile.fromJson(Map<String, dynamic> json) {
    return PlayerProfile(
      id: json['id']?.toString() ?? '',
      externalId: toInt(json['externalId']),
      name: json['name'] ?? '',
      firstname: json['firstname'],
      lastname: json['lastname'],
      age: json['age'] != null ? toInt(json['age']) : null,
      birthDate: json['birthDate'],
      birthPlace: json['birthPlace'],
      birthCountry: json['birthCountry'],
      nationality: json['nationality'],
      height: json['height'],
      weight: json['weight'],
      injured: json['injured'] ?? false,
      photo: json['photo'],
      statistics: json['statistics'] is List ? json['statistics'] : [],
    );
  }
}
