import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/team.dart';
import '../../models/league.dart';
import '../../models/fixture.dart';

part 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final ApiClient apiClient;
  static const int premierLeagueId = 39;

  SearchCubit(this.apiClient) : super(SearchInitial());

  Future<void> search(String query) async {
    if (query.isEmpty) {
      emit(SearchLoading());
      try {
        final leagues = await apiClient.getStoredLeagues();
        final premierLeagues = leagues.where((l) => l.externalId == premierLeagueId).toList();
        emit(SearchLoaded(
          teams: [],
          leagues: premierLeagues.isNotEmpty ? premierLeagues : leagues,
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
        final rawTeams = await apiClient.searchTeams(query);
        teams = rawTeams.where((t) {
          final country = t.country?.toLowerCase() ?? '';
          return country == 'england' || country == 'inglaterra';
        }).toList();
      } catch (e) {
        print('Error searching teams: $e');
      }

      try {
        final rawLeagues = await apiClient.searchLeagues(query);
        leagues = rawLeagues.where((l) => l.externalId == premierLeagueId || l.name.toLowerCase().contains('premier league') || l.name.toLowerCase().contains('premierleague')).toList();
      } catch (e) {
        print('Error searching leagues: $e');
      }

      try {
        final rawFixtures = await apiClient.searchFixtures(query);
        fixtures = rawFixtures.where((f) {
          final extId = f.league?.externalId ?? int.tryParse(f.leagueId);
          return extId == premierLeagueId;
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
