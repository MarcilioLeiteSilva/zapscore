class Video {
  final String id;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String videoUrl;
  final DateTime date;
  final String? duration;
  final String? leagueLogo;
  final String? teamLogo;

  Video({
    required this.id,
    required this.title,
    this.description,
    this.thumbnailUrl,
    required this.videoUrl,
    required this.date,
    this.duration,
    this.leagueLogo,
    this.teamLogo,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      thumbnailUrl: json['thumbnailUrl'],
      videoUrl: json['videoUrl'] ?? '',
      date: json['date'] != null ? DateTime.parse(json['date']).toLocal() : DateTime.now(),
      duration: json['duration'],
      leagueLogo: json['league']?['logo'],
      teamLogo: json['team']?['logo'],
    );
  }
}
