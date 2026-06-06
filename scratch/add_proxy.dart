import 'dart:io';

void main() {
  final dir = Directory('d:/zapscore/apps/mobile/lib');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = file.readAsStringSync();
    if (content.contains('CachedNetworkImage(imageUrl:')) {
      content = content.replaceAllMapped(
        RegExp(r'CachedNetworkImage\s*\(\s*imageUrl:\s*([^,)]+)'),
        (match) {
          final expr = match.group(1)!;
          if (expr.contains('proxyImage(')) return match.group(0)!;
          return 'CachedNetworkImage(imageUrl: proxyImage($expr)';
        }
      );
      file.writeAsStringSync(content);
      print('Proxied: ${file.path}');
    }
  }
}
