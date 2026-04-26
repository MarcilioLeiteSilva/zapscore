import 'package:flutter_bloc/flutter_bloc.dart';

part 'setting_state.dart';

class SettingCubit extends Cubit<SettingState> {
  SettingCubit()
      : super(SettingState(
          homeIndex: 0,
          selectedDate: DateTime.now(),
        ));

  void updateHomeIndex(int page) => emit(state.copyWith(
        homeIndex: page,
        showCalendar: false,
      ));

  void visibleCalendar() =>
      emit(state.copyWith(showCalendar: !state.showCalendar));

  void updateCalendarDate(DateTime date) =>
      emit(state.copyWith(showCalendar: false, selectedDate: date));
}
