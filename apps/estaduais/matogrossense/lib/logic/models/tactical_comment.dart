import 'model_utils.dart';

class TacticalComment {
  final String id;
  final int fixtureId;
  final int? minute;
  final String phase; // PRE_MATCH, FIRST_HALF, HALF_TIME, SECOND_HALF, FULL_TIME
  final String title;
  final String comment;
  final String? sentiment; // DOMINANT, BALANCED, CRITICAL, SURPRISE / DOMINANTE, EQUILIBRADO, etc.
  final DateTime? created;

  TacticalComment({
    required this.id,
    required this.fixtureId,
    this.minute,
    required this.phase,
    required this.title,
    required this.comment,
    this.sentiment,
    this.created,
  });

  factory TacticalComment.fromJson(Map<String, dynamic> json) {
    DateTime? parsedCreated;
    if (json['created'] != null) {
      try {
        parsedCreated = DateTime.parse(json['created'].toString());
      } catch (_) {}
    }

    return TacticalComment(
      id: json['id']?.toString() ?? '',
      fixtureId: toInt(json['fixture_id'] ?? json['fixtureId']),
      minute: json['minute'] != null ? toInt(json['minute']) : null,
      phase: json['phase']?.toString() ?? 'LIVE',
      title: json['title']?.toString() ?? '',
      comment: json['comment']?.toString() ?? '',
      sentiment: json['sentiment']?.toString(),
      created: parsedCreated,
    );
  }
}
