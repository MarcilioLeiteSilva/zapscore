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
    final extId = toInt(json['externalId']);
    String name = json['name'] ?? '';
    String? country = json['country'];

    if (extId == 2 || name.toLowerCase().contains('champions')) {
      name = 'Champions League';
      country = 'Europa';
    }

    return League(
      id: json['id']?.toString() ?? '',
      externalId: extId,
      name: name,
      country: country,
      logo: json['logo'],
      type: json['type'],
      season: json['season'] != null ? toInt(json['season']) : null,
    );
  }
}
