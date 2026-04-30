import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class UserRepository {
  static const String _keyName = 'user_name';
  static const String _keyNickname = 'user_nickname';
  static const String _keyPhoto = 'user_photo';
  static const String _keyNotifMatch = 'notif_match';
  static const String _keyNotifNews = 'notif_news';
  static const String _keyNotifVideo = 'notif_video';
  static const String _keyNotifStreaming = 'notif_streaming';
  static const String _keyNotifPromotions = 'notif_promotions';
  static const String _keyNotifAppUpdates = 'notif_app_updates';
  static const String _keyTeamNotifs = 'team_notif_prefs';

  Future<void> saveProfile(String name, String nickname, String? photoPath) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyName, name);
    await prefs.setString(_keyNickname, nickname);
    if (photoPath != null) {
      await prefs.setString(_keyPhoto, photoPath);
    }
  }

  Future<void> saveNotifSettings({
    bool? match,
    bool? news,
    bool? video,
    bool? streaming,
    bool? promotions,
    bool? updates,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (match != null) await prefs.setBool(_keyNotifMatch, match);
    if (news != null) await prefs.setBool(_keyNotifNews, news);
    if (video != null) await prefs.setBool(_keyNotifVideo, video);
    if (streaming != null) await prefs.setBool(_keyNotifStreaming, streaming);
    if (promotions != null) await prefs.setBool(_keyNotifPromotions, promotions);
    if (updates != null) await prefs.setBool(_keyNotifAppUpdates, updates);
  }

  Future<void> saveTeamNotif(String teamId, bool matches, bool news) async {
    final prefs = await SharedPreferences.getInstance();
    final String? jsonStr = prefs.getString(_keyTeamNotifs);
    Map<String, dynamic> data = jsonStr != null ? jsonDecode(jsonStr) : {};
    data[teamId] = {'matches': matches, 'news': news};
    await prefs.setString(_keyTeamNotifs, jsonEncode(data));
  }

  Future<Map<String, dynamic>> getTeamNotifs() async {
    final prefs = await SharedPreferences.getInstance();
    final String? jsonStr = prefs.getString(_keyTeamNotifs);
    return jsonStr != null ? jsonDecode(jsonStr) : {};
  }

  Future<Map<String, dynamic>> getSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final teamNotifs = await getTeamNotifs();
    return {
      'name': prefs.getString(_keyName),
      'nickname': prefs.getString(_keyNickname),
      'photo': prefs.getString(_keyPhoto),
      'notif_match': prefs.getBool(_keyNotifMatch) ?? true,
      'notif_news': prefs.getBool(_keyNotifNews) ?? false,
      'notif_video': prefs.getBool(_keyNotifVideo) ?? true,
      'notif_streaming': prefs.getBool(_keyNotifStreaming) ?? false,
      'notif_promotions': prefs.getBool(_keyNotifPromotions) ?? true,
      'notif_app_updates': prefs.getBool(_keyNotifAppUpdates) ?? true,
      'team_notifs': teamNotifs,
    };
  }
}
