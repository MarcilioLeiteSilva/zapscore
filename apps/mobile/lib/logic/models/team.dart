import 'model_utils.dart';

class Team {
  final String id;
  final int externalId;
  final String name;
  final String? code;
  final String? country;
  final String? logo;
  final int? founded;
  final bool? national;

  Team({
    required this.id,
    required this.externalId,
    required this.name,
    this.code,
    this.country,
    this.logo,
    this.founded,
    this.national,
  });

  factory Team.fromJson(Map<String, dynamic> json) {
    return Team(
      id: json['id']?.toString() ?? '',
      externalId: toInt(json['externalId']),
      name: json['name'] ?? '',
      code: json['code'],
      country: json['country'],
      logo: json['logo'],
      founded: json['founded'] != null ? toInt(json['founded']) : null,
      national: json['national'],
    );
  }
}
