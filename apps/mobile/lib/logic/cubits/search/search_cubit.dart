import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/team.dart';
import '../../models/league.dart';
import '../../models/fixture.dart';

part 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final ApiClient apiClient;

  SearchCubit(this.apiClient) : super(SearchInitial());

  Future<void> search(String query) async {
    if (query.isEmpty) {
      // Fetch initial popular/stored data
      emit(SearchLoading());
      try {
        final leagues = await apiClient.getStoredLeagues();
        // For teams, we don't have a stored list yet, so maybe search for "Brasil" or common teams
        // Or just show leagues for now as popular
        emit(SearchLoaded(
          teams: [],
          leagues: leagues,
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
        teams = await apiClient.searchTeams(query);
      } catch (e) {
        print('Error searching teams: $e');
      }

      try {
        leagues = await apiClient.searchLeagues(query);
      } catch (e) {
        print('Error searching leagues: $e');
      }

      try {
        fixtures = await apiClient.searchFixtures(query);
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
