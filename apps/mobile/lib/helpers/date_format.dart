part of 'helpers.dart';

String getMonthName(DateTime date) {
  return DateFormat('EEE').format(date);
}
