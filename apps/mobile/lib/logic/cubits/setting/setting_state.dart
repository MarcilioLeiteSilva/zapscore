part of 'setting_cubit.dart';

class SettingState {
  final int homeIndex;
  final bool showCalendar;
  final DateTime selectedDate;
  final bool isLiveSelected;
  final String language;
  final String theme;

  SettingState({
    required this.homeIndex,
    this.showCalendar = false,
    required this.selectedDate,
    this.isLiveSelected = false,
    this.language = 'pt',
    this.theme = 'default',
  });

  SettingState copyWith({
    final int? homeIndex,
    final bool? showCalendar,
    final DateTime? selectedDate,
    final bool? isLiveSelected,
    final String? language,
    final String? theme,
  }) {
    return SettingState(
      homeIndex: homeIndex ?? this.homeIndex,
      showCalendar: showCalendar ?? this.showCalendar,
      selectedDate: selectedDate ?? this.selectedDate,
      isLiveSelected: isLiveSelected ?? this.isLiveSelected,
      language: language ?? this.language,
      theme: theme ?? this.theme,
    );
  }
}
