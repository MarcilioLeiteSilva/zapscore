part of 'helpers.dart';

String getMonthName(DateTime date, String locale) {
  return DateFormat('EEE', locale).format(date).replaceAll('.', '');
}
