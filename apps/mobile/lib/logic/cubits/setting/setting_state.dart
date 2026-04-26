part of 'setting_cubit.dart';

class SettingState {
  final int homeIndex;
  final bool showCalendar;
  final DateTime selectedDate;

  SettingState({
    required this.homeIndex,
    this.showCalendar = false,
    required this.selectedDate,
  });

  SettingState copyWith({
    final int? homeIndex,
    final bool? showCalendar,
    final DateTime? selectedDate,
  }) {
    return SettingState(
      homeIndex: homeIndex ?? this.homeIndex,
      showCalendar: showCalendar ?? this.showCalendar,
      selectedDate: selectedDate ?? this.selectedDate,
    );
  }
}
