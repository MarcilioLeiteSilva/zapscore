import 'dart:io';

void main() {
  final dir = Directory('d:/zapscore/apps/mobile/lib');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = file.readAsStringSync();
    if (content.contains('Image.network(')) {
      content = content.replaceAllMapped(RegExp(r'Image\.network\s*\(\s*([^,)]+)'), (match) {
        return 'CachedNetworkImage(imageUrl: ${match.group(1)}';
      });
      
      if (!content.contains('package:cached_network_image/cached_network_image.dart')) {
        content = "import 'package:cached_network_image/cached_network_image.dart';\n" + content;
      }
      file.writeAsStringSync(content);
      print('Updated: ${file.path}');
    }
  }
}
