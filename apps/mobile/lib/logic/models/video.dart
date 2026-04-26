class Video {
  final String id;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String videoUrl;
  final DateTime date;
  final String? duration;

  Video({
    required this.id,
    required this.title,
    this.description,
    this.thumbnailUrl,
    required this.videoUrl,
    required this.date,
    this.duration,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      thumbnailUrl: json['thumbnailUrl'],
      videoUrl: json['videoUrl'] ?? '',
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      duration: json['duration'],
    );
  }
}
