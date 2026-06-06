import 'dart:io';

void main() {
  final dir = Directory('d:/zapscore/apps/mobile/lib');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = file.readAsStringSync();
    bool modified = false;

    if (content.contains('part of') && content.startsWith("import 'package:cached_network_image/cached_network_image.dart';\n")) {
      content = content.replaceFirst("import 'package:cached_network_image/cached_network_image.dart';\n", "");
      modified = true;
    }

    if (content.contains('loadingBuilder:')) {
      content = content.replaceAllMapped(
        RegExp(r'loadingBuilder:\s*\(context,\s*child,\s*loadingProgress\)\s*\{[^}]+\}'),
        (match) => 'progressIndicatorBuilder: (context, url, downloadProgress) => const Center(child: CircularProgressIndicator(strokeWidth: 2))'
      );
      modified = true;
    }

    if (modified) {
      file.writeAsStringSync(content);
      print('Fixed: ${file.path}');
    }
  }

  final widgetsFile = File('d:/zapscore/apps/mobile/lib/presentation/widgets/widgets.dart');
  if (widgetsFile.existsSync()) {
    var wContent = widgetsFile.readAsStringSync();
    if (!wContent.contains('cached_network_image')) {
      wContent = "import 'package:cached_network_image/cached_network_image.dart';\n" + wContent;
      widgetsFile.writeAsStringSync(wContent);
      print('Added import to widgets.dart');
    }
  }
}
