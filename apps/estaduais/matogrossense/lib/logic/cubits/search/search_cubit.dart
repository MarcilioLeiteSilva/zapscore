import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../helpers/helpers.dart';
import '../../../repository/api/api_client.dart';
import '../../models/team.dart';
import '../../models/league.dart';
import '../../models/fixture.dart';

part 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final ApiClient apiClient;
  final Map<int, Team> _matogrossenseTeamsMap = {};
  final Set<String> _matogrossenseTeamNames = {};
  static const List<int> matogrossenseIds = AppConfig.supportedLeagueIds; // [630]

  SearchCubit(this.apiClient) : super(SearchInitial());

  Future<void> _loadMatogrossenseTeams() async {
    if (_matogrossenseTeamsMap.isNotEmpty) return;
    for (var lId in matogrossenseIds) {
      try {
        final st = await apiClient.getStandings(lId);
        for (var s in st) {
          if (s.teamId > 0) {
            _matogrossenseTeamsMap[s.teamId] = Team(
              id: s.teamId.toString(),
              externalId: s.teamId,
              name: s.teamName,
              logo: s.teamLogo,
              country: 'Brasil',
            );
            if (s.teamName.isNotEmpty) {
              _matogrossenseTeamNames.add(s.teamName.toLowerCase());
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
              _matogrossenseTeamsMap[hId] = f.homeTeam!;
              if (f.homeTeam!.name.isNotEmpty) {
                _matogrossenseTeamNames.add(f.homeTeam!.name.toLowerCase());
              }
            }
          }
          if (f.awayTeam != null) {
            final aId = f.awayTeam!.externalId > 0
                ? f.awayTeam!.externalId
                : (int.tryParse(f.awayTeam!.id) ?? 0);
            if (aId > 0) {
              _matogrossenseTeamsMap[aId] = f.awayTeam!;
              if (f.awayTeam!.name.isNotEmpty) {
                _matogrossenseTeamNames.add(f.awayTeam!.name.toLowerCase());
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
        await _loadMatogrossenseTeams();
        final leagues = await apiClient.getStoredLeagues();
        final matogrossenseLeagues = leagues
            .where((l) =>
                matogrossenseIds.contains(l.externalId) ||
                l.name.toLowerCase().contains('matogrossense'))
            .toList();
        emit(SearchLoaded(
          teams: _matogrossenseTeamsMap.values.toList(),
          leagues: matogrossenseLeagues.isNotEmpty ? matogrossenseLeagues : leagues,
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
        await _loadMatogrossenseTeams();
        final q = cleanQuery.toLowerCase();

        // 1. Filtrar nos times conhecidos do Campeonato Matogrossense
        final Map<int, Team> filteredTeams = {};
        for (var team in _matogrossenseTeamsMap.values) {
          final tName = team.name.toLowerCase();
          final tCode = team.code?.toLowerCase() ?? '';
          if (tName.contains(q) || tCode.contains(q)) {
            filteredTeams[team.externalId] = team;
          }
        }

        // 2. Buscar times na API e filtrar estritamente pelos times do Matogrossense
        try {
          final rawTeams = await apiClient.searchTeams(cleanQuery);
          for (var t in rawTeams) {
            if (t.national == true) continue;
            final extId = t.externalId > 0
                ? t.externalId
                : (int.tryParse(t.id) ?? 0);
            final tName = t.name.toLowerCase();

            final bool isMatogrossense = (_matogrossenseTeamsMap.containsKey(extId)) ||
                _matogrossenseTeamNames.any((cn) =>
                    cn == tName ||
                    (cn.length > 3 && tName.contains(cn)) ||
                    (tName.length > 3 && cn.contains(tName)));

            if (isMatogrossense) {
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
                matogrossenseIds.contains(l.externalId) ||
                l.name.toLowerCase().contains('matogrossense'))
            .toList();
      } catch (e) {
        print('Error searching leagues: $e');
      }

      try {
        final rawFixtures = await apiClient.searchFixtures(cleanQuery);
        fixtures = rawFixtures.where((f) {
          final extId = f.league?.externalId ?? int.tryParse(f.leagueId);
          return extId != null && matogrossenseIds.contains(extId);
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
