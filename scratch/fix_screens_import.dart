import 'dart:io';

void main() {
  final screensFile = File('d:/zapscore/apps/mobile/lib/presentation/screens/screens.dart');
  if (screensFile.existsSync()) {
    var content = screensFile.readAsStringSync();
    if (!content.contains('cached_network_image')) {
      content = "import 'package:cached_network_image/cached_network_image.dart';\n" + content;
      screensFile.writeAsStringSync(content);
      print('Added import to screens.dart');
    }
  }
}
