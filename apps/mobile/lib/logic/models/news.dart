class News {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final DateTime date;
  final String? author;
  final String? source;
  final String? content;
  final String? externalUrl;

  News({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    required this.date,
    this.author,
    this.source,
    this.content,
    this.externalUrl,
  });

  factory News.fromJson(Map<String, dynamic> json) {
    return News(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['imageUrl'],
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      author: json['author'],
      source: json['source'],
      content: json['content'],
      externalUrl: json['externalUrl'],
    );
  }
}
