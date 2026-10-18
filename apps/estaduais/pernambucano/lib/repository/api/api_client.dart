import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../helpers/helpers.dart';
import '../../logic/models/league.dart';
import '../../logic/models/fixture.dart';
import '../../logic/models/standing.dart';
import '../../logic/models/scorer.dart';
import '../../logic/models/squad_player.dart';
import '../../logic/models/team.dart';
import '../../logic/models/news.dart';
import '../../logic/models/video.dart';
import '../../logic/models/player.dart';
import '../../logic/models/ai_performance_stats.dart';
import '../../logic/models/tactical_comment.dart';


class ApiClient {
  final String baseUrl = AppConfig.apiBaseUrl;

  dynamic _decodeResponse(http.Response response) {
    if (response.body.isEmpty || response.body == 'null') return null;
    try {
      return json.decode(response.body);
    } catch (e) {
      return null;
    }
  }

  String? _resolvedLeagueUuid;

  Future<String?> _resolveLeagueIdToUuid(String? rawLeagueId) async {
    if (rawLeagueId == null || rawLeagueId.isEmpty) return null;
    if (rawLeagueId.contains('-')) return rawLeagueId;
    if (_resolvedLeagueUuid != null) return _resolvedLeagueUuid;

    try {
      final leagues = await getStoredLeagues();
      final targetExtId = int.tryParse(rawLeagueId);
      for (final l in leagues) {
        if (l.id == rawLeagueId || (targetExtId != null && l.externalId == targetExtId)) {
          _resolvedLeagueUuid = l.id;
          return l.id;
        }
      }
    } catch (_) {}
    return null;
  }

  Future<List<News>> getNews({String? leagueId, String? teamId, int limit = 100}) async {
    final resolvedUuid = await _resolveLeagueIdToUuid(leagueId ?? AppConfig.leagueId);
    String url = '$baseUrl/news?limit=$limit';
    if (resolvedUuid != null) {
      url += '&leagueId=$resolvedUuid';
    } else if (leagueId != null) {
      url += '&leagueId=$leagueId';
    }
    if (teamId != null) url += '&teamId=$teamId';
    
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List && data.isNotEmpty) {
        return data.map((item) => News.fromJson(item)).toList();
      }
    }

    if (leagueId != null && teamId == null) {
      final fallbackResponse = await http.get(Uri.parse('$baseUrl/news?limit=$limit'));
      if (fallbackResponse.statusCode == 200) {
        final fallbackData = _decodeResponse(fallbackResponse);
        if (fallbackData is List) {
          return fallbackData.map((item) => News.fromJson(item)).toList();
        }
      }
    }

    return [];
  }

  Future<List<Video>> getVideos({String? leagueId, String? teamId, int limit = 100}) async {
    final resolvedUuid = await _resolveLeagueIdToUuid(leagueId ?? AppConfig.leagueId);
    String url = '$baseUrl/videos?limit=$limit';
    if (resolvedUuid != null) {
      url += '&leagueId=$resolvedUuid';
    } else if (leagueId != null) {
      url += '&leagueId=$leagueId';
    }
    if (teamId != null) url += '&teamId=$teamId';

    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List && data.isNotEmpty) {
        return data.map((item) => Video.fromJson(item)).toList();
      }
    }

    if (leagueId != null && teamId == null) {
      final fallbackResponse = await http.get(Uri.parse('$baseUrl/videos?limit=$limit'));
      if (fallbackResponse.statusCode == 200) {
        final fallbackData = _decodeResponse(fallbackResponse);
        if (fallbackData is List) {
          return fallbackData.map((item) => Video.fromJson(item)).toList();
        }
      }
    }

    return [];
  }

  Future<List<League>> getStoredLeagues() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/competitions/stored'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = _decodeResponse(response);
        if (data is List) {
          return data.map((item) => League.fromJson(item)).toList();
        }
        return [];
      } else {
        debugPrint('Error loading leagues: ${response.statusCode} - ${response.body}');
        throw Exception('Falha ao carregar ligas do servidor.');
      }
    } catch (e) {
      debugPrint('Connection error: $e');
      throw Exception('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
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

  Future<List<Fixture>> getRecentFixtures(int leagueId, {int limit = 1, int? season}) async {
    final seasonParam = season != null ? '&season=$season' : '';
    final response = await http.get(Uri.parse('$baseUrl/fixtures?leagueId=$leagueId&limit=$limit$seasonParam'));
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
      final recent = await getRecentFixtures(leagueId, limit: 1, season: leagueId == 622 ? 2027 : 2026);
      if (recent.isNotEmpty) {
        return recent.first;
      }
    } catch (e) {
      // Ignore
    }
    
    return null;
  }

  Future<List<Standing>> getStandings(int leagueId, {int? season}) async {
    final targetSeason = season ?? (leagueId == 622 ? 2027 : 2026);
    final response = await http.get(Uri.parse('$baseUrl/standings?leagueId=$leagueId&season=$targetSeason'));
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
    final targetSeason = season ?? (leagueId == 622 ? 2027 : 2026);
    final response = await http.get(Uri.parse('$baseUrl/competitions/$leagueId/scorers?season=$targetSeason'));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is List) {
        return data.map((item) => Scorer.fromJson(item)).toList();
      }
      return [];
    }
    throw Exception('Failed to load scorers');
  }

  Future<List<Fixture>> getLiveFixtures({int? leagueId}) async {
    try {
      final targetLeagueId = leagueId ?? AppConfig.externalLeagueId;
      final response = await http
          .get(Uri.parse('$baseUrl/fixtures?status=LIVE&leagueId=$targetLeagueId'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = _decodeResponse(response);
        if (data is List) {
          final list = data.map((item) => Fixture.fromJson(item)).toList();
          return list.where((f) {
            final extId = f.league?.externalId;
            final id = f.league?.id;
            final name = f.league?.name.toLowerCase() ?? '';
            return extId == targetLeagueId || id == '$targetLeagueId' || AppConfig.supportedLeagueIds.contains(extId) || name.contains('pernambucano');
          }).toList();
        }
        return [];
      } else {
        return [];
      }
    } catch (e) {
      debugPrint('Error loading live fixtures: $e');
      return [];
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
      debugPrint('Error searching leagues: $e');
      return [];
    }
  }

  Future<List<Fixture>> getFixturesByDate(int leagueId, String date) async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/fixtures?leagueId=$leagueId&date=$date'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = _decodeResponse(response);
        if (data is List) {
          return data.map((item) => Fixture.fromJson(item)).toList();
        }
        return [];
      } else {
        return [];
      }
    } catch (e) {
      debugPrint('Error loading fixtures for date $date: $e');
      return [];
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

  Future<Map<String, dynamic>> getTeamStats(String teamId, int leagueId, {int? season}) async {
    final targetSeason = season ?? (leagueId == 622 ? 2027 : 2026);
    final response = await http.get(Uri.parse('$baseUrl/teams/statistics?teamId=$teamId&leagueId=$leagueId&season=$targetSeason'));
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

  Future<List<SquadPlayer>> getSquad(int teamExternalId) async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/teams/$teamExternalId/squad'))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = _decodeResponse(response);
        if (data is List) {
          return data.map((item) => SquadPlayer.fromJson(item)).toList();
        }
      }
    } catch (e) {
      debugPrint('getSquad error: $e');
    }
    return [];
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

  Future<Map<String, dynamic>?> getFixtureAiAnalysis(String fixtureId, [String? lang]) async {
    try {
      final queryLang = (lang != null && lang.isNotEmpty) ? '?lang=$lang' : '';
      final response = await http.get(Uri.parse('$baseUrl/fixtures/$fixtureId/ai-analysis$queryLang'));
      if (response.statusCode == 200) {
        return _decodeResponse(response);
      }
    } catch (e) {
      debugPrint('Error loading AI analysis: $e');
    }
    return null;
  }

  Future<Map<String, dynamic>?> getFixtureH2H(String fixtureId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/fixtures/$fixtureId/h2h'));
      if (response.statusCode == 200) {
        return _decodeResponse(response);
      }
    } catch (e) {
      debugPrint('Error loading H2H: $e');
    }
    return null;
  }

  Future<void> syncFixture(int externalId) async {
    try {
      await http.post(Uri.parse('$baseUrl/sync/fixture/$externalId'));
    } catch (e) {
      debugPrint('Sync failed: $e');
    }
  }

  Future<AiPerformanceStats> getAiPerformanceStats({int? leagueId, String? leagueIds, int? days}) async {
    String url = '$baseUrl/fixtures/ai-analysis/performance';
    List<String> params = [];
    if (leagueId != null) params.add('leagueId=$leagueId');
    if (leagueIds != null) params.add('leagueIds=$leagueIds');
    if (days != null) params.add('days=$days');
    if (params.isNotEmpty) {
      url += '?${params.join('&')}';
    }
    
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = _decodeResponse(response);
      if (data is Map<String, dynamic>) {
        return AiPerformanceStats.fromJson(data);
      }
    }
    throw Exception('Failed to load AI performance stats');
  }

  Future<Map<String, dynamic>?> getMatchBroadcast(int fixtureId) async {
    try {
      final pbUrl =
          'https://zapscore-pocketbase-comentarios.gtalg3.easypanel.host/api/collections/fixture_broadcasts/records?filter=(fixture_id=$fixtureId)&limit=1';
      final pbRes =
          await http.get(Uri.parse(pbUrl)).timeout(const Duration(seconds: 3));
      if (pbRes.statusCode == 200) {
        final data = json.decode(pbRes.body);
        if (data != null &&
            data['items'] != null &&
            (data['items'] as List).isNotEmpty) {
          return data['items'][0] as Map<String, dynamic>;
        }
      }
    } catch (_) {}

    try {
      final apiRes = await http
          .get(Uri.parse('$baseUrl/fixtures/$fixtureId/broadcast'))
          .timeout(const Duration(seconds: 3));
      if (apiRes.statusCode == 200) {
        final data = _decodeResponse(apiRes);
        if (data is Map<String, dynamic>) {
          return data;
        }
      }
    } catch (_) {}

    return null;
  }

  Future<List<TacticalComment>> getFixtureTacticalComments(int fixtureId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/fixtures/$fixtureId/comments'));
      if (response.statusCode == 200) {
        final data = _decodeResponse(response);
        if (data is Map<String, dynamic> && data['comments'] is List) {
          return (data['comments'] as List)
              .map((c) => TacticalComment.fromJson(c))
              .toList();
        } else if (data is List) {
          return data.map((c) => TacticalComment.fromJson(c)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error loading tactical comments: $e');
    }
    return [];
  }
}

