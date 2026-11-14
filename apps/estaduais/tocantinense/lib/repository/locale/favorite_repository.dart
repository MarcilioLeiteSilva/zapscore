import 'package:shared_preferences/shared_preferences.dart';

class FavoriteRepository {
  static const String _keyTeams = 'fav_teams';
  static const String _keyLeagues = 'fav_leagues';
  static const String _keyFixtures = 'fav_fixtures';

  Future<List<String>> getFavoriteTeams() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_keyTeams) ?? [];
  }

  Future<void> toggleTeam(String teamId) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_keyTeams) ?? [];
    if (list.contains(teamId)) {
      list.remove(teamId);
    } else {
      list.add(teamId);
    }
    await prefs.setStringList(_keyTeams, list);
  }

  Future<List<String>> getFavoriteLeagues() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_keyLeagues) ?? [];
  }

  Future<void> toggleLeague(String leagueId) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_keyLeagues) ?? [];
    if (list.contains(leagueId)) {
      list.remove(leagueId);
    } else {
      list.add(leagueId);
    }
    await prefs.setStringList(_keyLeagues, list);
  }

  Future<List<String>> getFavoriteFixtures() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_keyFixtures) ?? [];
  }

  Future<void> toggleFixture(String fixtureId) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_keyFixtures) ?? [];
    if (list.contains(fixtureId)) {
      list.remove(fixtureId);
    } else {
      list.add(fixtureId);
    }
    await prefs.setStringList(_keyFixtures, list);
  }

  Future<bool> isTeamFavorite(String teamId) async {
    final list = await getFavoriteTeams();
    return list.contains(teamId);
  }

  Future<bool> isLeagueFavorite(String leagueId) async {
    final list = await getFavoriteLeagues();
    return list.contains(leagueId);
  }

  Future<bool> isFixtureFavorite(String fixtureId) async {
    final list = await getFavoriteFixtures();
    return list.contains(fixtureId);
  }
}
