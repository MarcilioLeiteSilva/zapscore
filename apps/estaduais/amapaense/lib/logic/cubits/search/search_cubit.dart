import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../helpers/helpers.dart';
import '../../../repository/api/api_client.dart';
import '../../models/team.dart';
import '../../models/league.dart';
import '../../models/fixture.dart';

part 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final ApiClient apiClient;
  final Map<int, Team> _amapaenseTeamsMap = {};
  final Set<String> _amapaenseTeamNames = {};
  static const List<int> amapaenseIds = AppConfig.supportedLeagueIds;

  static final List<Team> _defaultTeams = [
    Team(id: '7868', externalId: 7868, name: 'Trem', logo: 'https://media.api-sports.io/football/teams/7868.png', country: 'Brasil'),
    Team(id: '7869', externalId: 7869, name: 'Ypiranga-AP', logo: 'https://media.api-sports.io/football/teams/7869.png', country: 'Brasil'),
    Team(id: '7856', externalId: 7856, name: 'Santos-AP', logo: 'https://media.api-sports.io/football/teams/7856.png', country: 'Brasil'),
    Team(id: '7847', externalId: 7847, name: 'Macapá', logo: 'https://media.api-sports.io/football/teams/7847.png', country: 'Brasil'),
    Team(id: '7851', externalId: 7851, name: 'Oratório', logo: 'https://media.api-sports.io/football/teams/7851.png', country: 'Brasil'),
    Team(id: '7858', externalId: 7858, name: 'São José-AP', logo: 'https://media.api-sports.io/football/teams/7858.png', country: 'Brasil'),
    Team(id: '7844', externalId: 7844, name: 'Cristal', logo: 'https://media.api-sports.io/football/teams/7844.png', country: 'Brasil'),
    Team(id: '7846', externalId: 7846, name: 'Independente-AP', logo: 'https://media.api-sports.io/football/teams/7846.png', country: 'Brasil'),
  ];

  SearchCubit(this.apiClient) : super(SearchInitial());

  Future<void> _loadAmapaenseTeams() async {
    if (_amapaenseTeamsMap.isEmpty) {
      for (var dt in _defaultTeams) {
        _amapaenseTeamsMap[dt.externalId] = dt;
        _amapaenseTeamNames.add(dt.name.toLowerCase());
      }
    }
    for (var lId in amapaenseIds) {
      try {
        final st = await apiClient.getStandings(lId);
        for (var s in st) {
          if (s.teamId > 0) {
            _amapaenseTeamsMap[s.teamId] = Team(
              id: s.teamId.toString(),
              externalId: s.teamId,
              name: s.teamName,
              logo: s.teamLogo,
              country: 'Brasil',
            );
            if (s.teamName.isNotEmpty) {
              _amapaenseTeamNames.add(s.teamName.toLowerCase());
            }
          }
        }
      } catch (_) {}

      try {
        final fix = await apiClient.getRecentFixtures(lId, limit: 50);
        for (var f in fix) {
          if (f.homeTeam != null) {
            final hId = f.homeTeam!.externalId > 0
                ? f.homeTeam!.externalId
                : (int.tryParse(f.homeTeam!.id) ?? 0);
            if (hId > 0) {
              _amapaenseTeamsMap[hId] = f.homeTeam!;
              if (f.homeTeam!.name.isNotEmpty) {
                _amapaenseTeamNames.add(f.homeTeam!.name.toLowerCase());
              }
            }
          }
          if (f.awayTeam != null) {
            final aId = f.awayTeam!.externalId > 0
                ? f.awayTeam!.externalId
                : (int.tryParse(f.awayTeam!.id) ?? 0);
            if (aId > 0) {
              _amapaenseTeamsMap[aId] = f.awayTeam!;
              if (f.awayTeam!.name.isNotEmpty) {
                _amapaenseTeamNames.add(f.awayTeam!.name.toLowerCase());
              }
            }
          }
        }
      } catch (_) {}
    }
  }

  Future<void> search(String query) async {
    final cleanQuery = query.trim();
    final defaultLeague = League(
      id: AppConfig.leagueId,
      externalId: AppConfig.externalLeagueId,
      name: AppConfig.appName,
      country: 'Brasil',
      logo: AppConfig.defaultLeagueLogo,
    );

    if (cleanQuery.isEmpty) {
      emit(SearchLoading());
      try {
        await _loadAmapaenseTeams();
        final leagues = await apiClient.getStoredLeagues();
        final amapaenseLeagues = leagues
            .where((l) =>
                amapaenseIds.contains(l.externalId) ||
                l.name.toLowerCase().contains('amapaense'))
            .toList();
        emit(SearchLoaded(
          teams: _amapaenseTeamsMap.values.toList(),
          leagues: amapaenseLeagues.isNotEmpty ? amapaenseLeagues : [defaultLeague],
          fixtures: [],
        ));
      } catch (e) {
        emit(SearchInitial());
      }
      return;
    }

    emit(SearchLoading());
    try {
      List<Team> teams = [];
      List<League> leagues = [];
      List<Fixture> fixtures = [];

      try {
        await _loadAmapaenseTeams();
        final q = cleanQuery.toLowerCase();

        // 1. Filtrar nos times conhecidos do Amapaense
        final Map<int, Team> filteredTeams = {};
        for (var team in _amapaenseTeamsMap.values) {
          final tName = team.name.toLowerCase();
          final tCode = team.code?.toLowerCase() ?? '';
          if (tName.contains(q) || tCode.contains(q)) {
            filteredTeams[team.externalId] = team;
          }
        }

        // 2. Buscar times na API e filtrar estritamente pelos times do Amapaense
        try {
          final rawTeams = await apiClient.searchTeams(cleanQuery);
          for (var t in rawTeams) {
            if (t.national == true) continue;
            final extId = t.externalId > 0
                ? t.externalId
                : (int.tryParse(t.id) ?? 0);
            final tName = t.name.toLowerCase();

            final bool isAmapaense = (_amapaenseTeamsMap.containsKey(extId)) ||
                _amapaenseTeamNames.any((cn) =>
                    cn == tName ||
                    (cn.length > 3 && tName.contains(cn)) ||
                    (tName.length > 3 && cn.contains(tName)));

            if (isAmapaense) {
              final key = extId > 0 ? extId : t.id.hashCode;
              filteredTeams.putIfAbsent(key, () => t);
            }
          }
        } catch (e) {
          print('Error searching teams via API: $e');
        }

        teams = filteredTeams.values.toList();
      } catch (e) {
        print('Error searching teams: $e');
      }

      try {
        final q = cleanQuery.toLowerCase();
        final rawLeagues = await apiClient.searchLeagues(cleanQuery);
        leagues = rawLeagues
            .where((l) =>
                amapaenseIds.contains(l.externalId) ||
                l.name.toLowerCase().contains('amapaense'))
            .toList();
        if (leagues.isEmpty && (AppConfig.appName.toLowerCase().contains(q) || 'amapaense'.contains(q))) {
          leagues = [defaultLeague];
        }
      } catch (e) {
        print('Error searching leagues: $e');
      }

      try {
        final q = cleanQuery.toLowerCase();
        final rawFixtures = await apiClient.getRecentFixtures(AppConfig.externalLeagueId, limit: 100);
        fixtures = rawFixtures.where((f) {
          final hName = f.homeTeam?.name.toLowerCase() ?? '';
          final aName = f.awayTeam?.name.toLowerCase() ?? '';
          final round = f.round?.toLowerCase() ?? '';
          return hName.contains(q) || aName.contains(q) || round.contains(q);
        }).toList();
      } catch (e) {
        print('Error searching fixtures: $e');
      }

      emit(SearchLoaded(
        teams: teams,
        leagues: leagues,
        fixtures: fixtures,
      ));
    } catch (e) {
      emit(SearchError(e.toString()));
    }
  }

  void clear() {
    emit(SearchInitial());
  }
}
