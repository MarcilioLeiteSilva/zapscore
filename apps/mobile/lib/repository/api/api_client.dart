import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../logic/models/league.dart';
import '../../logic/models/fixture.dart';
import '../../logic/models/standing.dart';
import '../../logic/models/scorer.dart';
import '../../logic/models/team.dart';

class ApiClient {
  final String baseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

  Future<List<League>> getStoredLeagues() async {
    final response = await http.get(Uri.parse('$baseUrl/competitions/stored'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((item) => League.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load leagues');
    }
  }

  Future<List<Fixture>> getTodayFixtures(int leagueId) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures/today?leagueId=$leagueId'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((item) => Fixture.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load today fixtures');
    }
  }

  Future<List<Fixture>> getRecentFixtures(int leagueId, {int limit = 1}) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?leagueId=$leagueId&limit=$limit'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((item) => Fixture.fromJson(item)).toList();
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
      final List data = jsonDecode(response.body);
      return data.map((item) => Standing.fromJson(item)).toList();
    }
    throw Exception('Failed to load standings');
  }

  Future<List<Scorer>> getScorers(int leagueId, {int? season}) async {
    final response = await http.get(Uri.parse('$baseUrl/competitions/$leagueId/scorers?season=${season ?? 2026}'));
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((item) => Scorer.fromJson(item)).toList();
    }
    throw Exception('Failed to load scorers');
  }

  Future<List<Fixture>> getLiveFixtures() async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?status=LIVE'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((item) => Fixture.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load live fixtures');
    }
  }

  Future<Fixture> getFixtureDetails(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures/$id'));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Fixture.fromJson(data);
    } else {
      throw Exception('Failed to load fixture details');
    }
  }

  Future<List<Team>> searchTeams(String query) async {
    final response = await http.get(Uri.parse('$baseUrl/teams?search=$query'));
    if (response.statusCode == 200) {
      if (response.body.isEmpty) return [];
      try {
        List<dynamic> data = json.decode(response.body);
        return data.map((item) => Team.fromJson(item)).toList();
      } catch (e) {
        return [];
      }
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
      List<dynamic> data = json.decode(response.body);
      return data.map((item) => Fixture.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load fixtures for date $date');
    }
  }

  Future<List<Fixture>> getTeamFixtures(String teamId) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?teamId=$teamId'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((item) => Fixture.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load team fixtures');
    }
  }

  Future<Map<String, dynamic>> getTeamStats(String teamId, int leagueId) async {
    final response = await http.get(Uri.parse('$baseUrl/teams/statistics?teamId=$teamId&leagueId=$leagueId'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load team statistics');
    }
  }

  Future<List<Fixture>> searchFixtures(String query) async {
    final response = await http.get(Uri.parse('$baseUrl/fixtures?search=$query'));
    if (response.statusCode == 200) {
      if (response.body.isEmpty) return [];
      try {
        List<dynamic> data = json.decode(response.body);
        return data.map((item) => Fixture.fromJson(item)).toList();
      } catch (e) {
        return [];
      }
    } else {
      throw Exception('Failed to search fixtures');
    }
  }

  Future<Team> getTeamDetails(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/teams/$id'));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Team.fromJson(data);
    } else {
      throw Exception('Failed to load team details');
    }
  }
}
