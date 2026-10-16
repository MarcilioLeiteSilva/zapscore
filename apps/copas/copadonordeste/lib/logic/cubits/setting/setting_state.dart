part of 'setting_cubit.dart';

class SettingState {
  final int homeIndex;
  final bool showCalendar;
  final DateTime selectedDate;
  final bool isLiveSelected;
  final String language;
  final String theme;
  final String? userName;
  final String? userNickname;
  final String? userPhoto;
  final bool notifMatchAlert;
  final bool notifNews;
  final bool notifVideo;
  final bool notifStreaming;
  final bool notifPromotions;
  final bool notifAppUpdates;
  final Map<String, dynamic> teamNotifs;

  SettingState({
    required this.homeIndex,
    this.showCalendar = false,
    required this.selectedDate,
    this.isLiveSelected = false,
    this.language = 'pt',
    this.theme = 'default',
    this.userName,
    this.userNickname,
    this.userPhoto,
    this.notifMatchAlert = true,
    this.notifNews = false,
    this.notifVideo = true,
    this.notifStreaming = false,
    this.notifPromotions = true,
    this.notifAppUpdates = true,
    this.teamNotifs = const {},
  });

  SettingState copyWith({
    final int? homeIndex,
    final bool? showCalendar,
    final DateTime? selectedDate,
    final bool? isLiveSelected,
    final String? language,
    final String? theme,
    final String? userName,
    final String? userNickname,
    final String? userPhoto,
    final bool? notifMatchAlert,
    final bool? notifNews,
    final bool? notifVideo,
    final bool? notifStreaming,
    final bool? notifPromotions,
    final bool? notifAppUpdates,
    final Map<String, dynamic>? teamNotifs,
  }) {
    return SettingState(
      homeIndex: homeIndex ?? this.homeIndex,
      showCalendar: showCalendar ?? this.showCalendar,
      selectedDate: selectedDate ?? this.selectedDate,
      isLiveSelected: isLiveSelected ?? this.isLiveSelected,
      language: language ?? this.language,
      theme: theme ?? this.theme,
      userName: userName ?? this.userName,
      userNickname: userNickname ?? this.userNickname,
      userPhoto: userPhoto ?? this.userPhoto,
      notifMatchAlert: notifMatchAlert ?? this.notifMatchAlert,
      notifNews: notifNews ?? this.notifNews,
      notifVideo: notifVideo ?? this.notifVideo,
      notifStreaming: notifStreaming ?? this.notifStreaming,
      notifPromotions: notifPromotions ?? this.notifPromotions,
      notifAppUpdates: notifAppUpdates ?? this.notifAppUpdates,
      teamNotifs: teamNotifs ?? this.teamNotifs,
    );
  }
}
