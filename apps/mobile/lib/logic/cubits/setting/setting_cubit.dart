import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../repository/locale/user_repository.dart';

part 'setting_state.dart';

class SettingCubit extends Cubit<SettingState> {
  final UserRepository userRepository;

  SettingCubit({required this.userRepository})
      : super(SettingState(
          homeIndex: 0,
          selectedDate: DateTime.now(),
        )) {
    loadSettings();
  }

  Future<void> loadSettings() async {
    final data = await userRepository.getSettings();
    emit(state.copyWith(
      userName: data['name'],
      userNickname: data['nickname'],
      userPhoto: data['photo'],
      notifMatchAlert: data['notif_match'],
      notifNews: data['notif_news'],
      notifVideo: data['notif_video'],
      notifStreaming: data['notif_streaming'],
      notifPromotions: data['notif_promotions'],
      notifAppUpdates: data['notif_app_updates'],
      teamNotifs: data['team_notifs'] ?? {},
    ));
  }

  Future<void> updateTeamNotif(String teamId, bool matches, bool news) async {
    await userRepository.saveTeamNotif(teamId, matches, news);
    final newTeamNotifs = Map<String, dynamic>.from(state.teamNotifs);
    newTeamNotifs[teamId] = {'matches': matches, 'news': news};
    emit(state.copyWith(teamNotifs: newTeamNotifs));
  }

  Future<void> updateNotifSettings({
    bool? match,
    bool? news,
    bool? video,
    bool? streaming,
    bool? promotions,
    bool? updates,
  }) async {
    await userRepository.saveNotifSettings(
      match: match,
      news: news,
      video: video,
      streaming: streaming,
      promotions: promotions,
      updates: updates,
    );
    emit(state.copyWith(
      notifMatchAlert: match ?? state.notifMatchAlert,
      notifNews: news ?? state.notifNews,
      notifVideo: video ?? state.notifVideo,
      notifStreaming: streaming ?? state.notifStreaming,
      notifPromotions: promotions ?? state.notifPromotions,
      notifAppUpdates: updates ?? state.notifAppUpdates,
    ));
  }

  Future<void> updateProfile({String? name, String? nickname, String? photo}) async {
    final newName = name ?? state.userName;
    final newNickname = nickname ?? state.userNickname;
    final newPhoto = photo ?? state.userPhoto;

    await userRepository.saveProfile(newName ?? '', newNickname ?? '', newPhoto);
    emit(state.copyWith(
      userName: newName,
      userNickname: newNickname,
      userPhoto: newPhoto,
    ));
  }

  void updateHomeIndex(int page) => emit(state.copyWith(
        homeIndex: page,
        showCalendar: false,
      ));

  void visibleCalendar() =>
      emit(state.copyWith(showCalendar: !state.showCalendar));

  void updateCalendarDate(DateTime date) =>
      emit(state.copyWith(showCalendar: false, selectedDate: date, isLiveSelected: false));

  void toggleLive() => 
      emit(state.copyWith(isLiveSelected: !state.isLiveSelected, showCalendar: false));

  void updateLanguage(String lang) => emit(state.copyWith(language: lang));

  void updateTheme(String theme) => emit(state.copyWith(theme: theme));
}
