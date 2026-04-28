import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../logic/models/league.dart';
import '../../logic/models/fixture.dart';
import '../../logic/models/standing.dart';
import '../../logic/models/scorer.dart';
import '../../logic/models/team.dart';
import '../../logic/models/news.dart';
import '../../logic/models/video.dart';
import '../../logic/models/player.dart';

class ApiClient {
  final String baseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

  dynamic _decodeResponse(http.Response response) {
    if (response.body.isEmpty || response.body == 'null') return null;
    try {
      return json.decode(response.body);
    } catch (e) {
      return null;
    }
  }

  Future<List<News>> getNews({String? leagueId, String? teamId, int limit = 100}) async {
    String url = '$baseUrl/news?limit=$limit';
    if (leagueId != null) url += '&leagueId=$leagueId';
    if (teamId != null) url += '&teamId=$teamId';
    
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => News.fromJson(item)).toList();
      }
    }
    return [];
  }

  Future<List<Video>> getVideos({String? leagueId, String? teamId, int limit = 100}) async {
    String url = '$baseUrl/videos?limit=$limit';
    if (leagueId != null) url += '&leagueId=$leagueId';
    if (teamId != null) url += '&teamId=$teamId';

    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Video.fromJson(item)).toList();
      }
    }
    return [];
  }

  Future<List<League>> getStoredLeagues() async {
    final response = await http.get(Uri.parse('$baseUrl/competitions/stored'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => League.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load leagues');
    }
  }

  Future<List<Fixture>> getTodayFixtures(int leagueId) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures/today?leagueId=$leagueId'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Fixture.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load today fixtures');
    }
  }

  Future<List<Fixture>> getRecentFixtures(int leagueId, {int limit = 1}) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?leagueId=$leagueId&limit=$limit'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Fixture.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load recent fixtures');
    }
  }

  Future<Fixture?> getFixtureWithMatchLogic(int leagueId) async {
    // 1. Try today
    try {
      final today = await getTodayFixtures(leagueId);
      if (today.isNotEmpty) {
        return today.first;
      }
    } catch (e) {
      // Ignore and try recent
    }

    // 2. Try recent (last match)
    try {
      final recent = await getRecentFixtures(leagueId, limit: 1);
      if (recent.isNotEmpty) {
        return recent.first;
      }
    } catch (e) {
      // Ignore
    }
    
    return null;
  }

  Future<List<Standing>> getStandings(int leagueId, {int? season}) async {
    final response = await http.get(Uri.parse('$baseUrl/standings?leagueId=$leagueId&season=${season ?? 2026}'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Standing.fromJson(item)).toList();
      }
      return [];
    }
    throw Exception('Failed to load standings');
  }

  Future<List<Scorer>> getScorers(int leagueId, {int? season}) async {
    final response = await http.get(Uri.parse('$baseUrl/competitions/$leagueId/scorers?season=${season ?? 2026}'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Scorer.fromJson(item)).toList();
      }
      return [];
    }
    throw Exception('Failed to load scorers');
  }

  Future<List<Fixture>> getLiveFixtures() async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?status=LIVE'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Fixture.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load live fixtures');
    }
  }

  Future<Fixture> getFixtureDetails(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures/$id'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data != null) {
        return Fixture.fromJson(data);
      }
      throw Exception('Fixture data is null');
    } else {
      throw Exception('Failed to load fixture details');
    }
  }

  Future<List<Team>> searchTeams(String query) async {
    final response = await http.get(Uri.parse('$baseUrl/teams?search=$query'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Team.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to search teams');
    }
  }

  Future<List<League>> searchLeagues(String query) async {
    try {
      final allLeagues = await getStoredLeagues();
      if (query.isEmpty) return allLeagues;
      return allLeagues
          .where((l) => l.name.toLowerCase().contains(query.toLowerCase()))
          .toList();
    } catch (e) {
      print('Error searching leagues: $e');
      return [];
    }
  }

  Future<List<Fixture>> getFixturesByDate(int leagueId, String date) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?leagueId=$leagueId&date=$date'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Fixture.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load fixtures for date $date');
    }
  }

  Future<List<Fixture>> getTeamFixtures(String teamId) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?teamId=$teamId'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Fixture.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to load team fixtures');
    }
  }

  Future<Map<String, dynamic>> getTeamStats(String teamId, int leagueId) async {
    final response = await http.get(Uri.parse('$baseUrl/teams/statistics?teamId=$teamId&leagueId=$leagueId'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is Map<String, dynamic>) {
        return data;
      }
      return {};
    } else {
      throw Exception('Failed to load team statistics');
    }
  }

  Future<List<Fixture>> searchFixtures(String query) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?search=$query'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Fixture.fromJson(item)).toList();
      }
      return [];
    } else {
      throw Exception('Failed to search fixtures');
    }
  }

  Future<Team> getTeamDetails(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/teams/$id'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data != null) {
        return Team.fromJson(data);
      }
      throw Exception('Team details are null');
    } else {
      throw Exception('Failed to load team details');
    }
  }

  Future<PlayerProfile?> getPlayerDetails(int id, {int? season}) async {
    final response = await http.get(Uri.parse('$baseUrl/players/$id${season != null ? '?season=$season' : ''}'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data != null) {
        return PlayerProfile.fromJson(data);
      }
    }
    return null;
  }

  Future<void> syncFixture(int externalId) async {
    try {
      await http.post(Uri.parse('$baseUrl/sync/fixture/$externalId'));
    } catch (e) {
      print('Sync failed: $e');
    }
  }
}
