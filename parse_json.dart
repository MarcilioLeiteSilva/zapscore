import 'dart:io';
import 'dart:convert';
void main() {
  final bytes = File('d:/zapscore/api_competitions.json').readAsBytesSync();
  final text = utf8.decode(bytes, allowMalformed: true).replaceAll('\x00', '');
  try {
    final data = json.decode(text);
    if (data is List && data.isNotEmpty) {
      print('First item:');
      print(const JsonEncoder.withIndent('  ').convert(data[0]));
    } else {
      print('Empty list or not a list: $data');
    }
  } catch(e) {
    print('Not JSON: ' + text.substring(0, 200));
  }
}
