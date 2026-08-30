import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../helpers/helpers.dart';
import '../../../repository/api/api_client.dart';
import '../../models/team.dart';
import '../../models/league.dart';
import '../../models/fixture.dart';

part 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final ApiClient apiClient;
  final Map<int, Team> _mineiroTeamsMap = {};
  final Set<String> _mineiroTeamNames = {};
  static const List<int> mineiroIds = AppConfig.supportedLeagueIds; // [629, 619]

  SearchCubit(this.apiClient) : super(SearchInitial());

  Future<void> _loadMineiroTeams() async {
    if (_mineiroTeamsMap.isNotEmpty) return;
    for (var lId in mineiroIds) {
      try {
        final st = await apiClient.getStandings(lId);
        for (var s in st) {
          if (s.teamId > 0) {
            _mineiroTeamsMap[s.teamId] = Team(
              id: s.teamId.toString(),
              externalId: s.teamId,
              name: s.teamName,
              logo: s.teamLogo,
              country: 'Brazil',
            );
            if (s.teamName.isNotEmpty) {
              _mineiroTeamNames.add(s.teamName.toLowerCase());
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
              _mineiroTeamsMap[hId] = f.homeTeam!;
              if (f.homeTeam!.name.isNotEmpty) {
                _mineiroTeamNames.add(f.homeTeam!.name.toLowerCase());
              }
            }
          }
          if (f.awayTeam != null) {
            final aId = f.awayTeam!.externalId > 0
                ? f.awayTeam!.externalId
                : (int.tryParse(f.awayTeam!.id) ?? 0);
            if (aId > 0) {
              _mineiroTeamsMap[aId] = f.awayTeam!;
              if (f.awayTeam!.name.isNotEmpty) {
                _mineiroTeamNames.add(f.awayTeam!.name.toLowerCase());
              }
            }
          }
        }
      } catch (_) {}
    }
  }

  Future<void> search(String query) async {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) {
      emit(SearchLoading());
      try {
        await _loadMineiroTeams();
        final leagues = await apiClient.getStoredLeagues();
        final mineiroLeagues = leagues
            .where((l) =>
                mineiroIds.contains(l.externalId) ||
                l.name.toLowerCase().contains('mineiro'))
            .toList();
        emit(SearchLoaded(
          teams: _mineiroTeamsMap.values.toList(),
          leagues: mineiroLeagues.isNotEmpty ? mineiroLeagues : leagues,
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
        await _loadMineiroTeams();
        final q = cleanQuery.toLowerCase();

        // 1. Filtrar nos times conhecidos do Mineiro Módulo 1 e Módulo 2
        final Map<int, Team> filteredTeams = {};
        for (var team in _mineiroTeamsMap.values) {
          final tName = team.name.toLowerCase();
          final tCode = team.code?.toLowerCase() ?? '';
          if (tName.contains(q) || tCode.contains(q)) {
            filteredTeams[team.externalId] = team;
          }
        }

        // 2. Buscar times na API e filtrar estritamente pelos times do Mineiro
        try {
          final rawTeams = await apiClient.searchTeams(cleanQuery);
          for (var t in rawTeams) {
            if (t.national == true) continue;
            final extId = t.externalId > 0
                ? t.externalId
                : (int.tryParse(t.id) ?? 0);
            final tName = t.name.toLowerCase();

            final bool isMineiro = (_mineiroTeamsMap.containsKey(extId)) ||
                _mineiroTeamNames.any((cn) =>
                    cn == tName ||
                    (cn.length > 3 && tName.contains(cn)) ||
                    (tName.length > 3 && cn.contains(tName)));

            if (isMineiro) {
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
        final rawLeagues = await apiClient.searchLeagues(cleanQuery);
        leagues = rawLeagues
            .where((l) =>
                mineiroIds.contains(l.externalId) ||
                l.name.toLowerCase().contains('mineiro'))
            .toList();
      } catch (e) {
        print('Error searching leagues: $e');
      }

      try {
        final rawFixtures = await apiClient.searchFixtures(cleanQuery);
        fixtures = rawFixtures.where((f) {
          final extId = f.league?.externalId ?? int.tryParse(f.leagueId);
          return extId != null && mineiroIds.contains(extId);
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
