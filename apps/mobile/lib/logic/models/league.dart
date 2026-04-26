import 'model_utils.dart';

class League {
  final String id;
  final int externalId;
  final String name;
  final String? country;
  final String? logo;
  final String? type;
  final int? season;

  League({
    required this.id,
    required this.externalId,
    required this.name,
    this.country,
    this.logo,
    this.type,
    this.season,
  });

  factory League.fromJson(Map<String, dynamic> json) {
    return League(
      id: json['id']?.toString() ?? '',
      externalId: toInt(json['externalId']),
      name: json['name'] ?? '',
      country: json['country'],
      logo: json['logo'],
      type: json['type'],
      season: json['season'] != null ? toInt(json['season']) : null,
    );
  }
}
