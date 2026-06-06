import 'dart:io';

void main() {
  final dir = Directory('d:/zapscore/apps/mobile/lib');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = file.readAsStringSync();
    if (content.contains('errorBuilder:')) {
      content = content.replaceAll('errorBuilder:', 'errorWidget:');
      file.writeAsStringSync(content);
      print('Updated errorBuilder: ${file.path}');
    }
  }
}
