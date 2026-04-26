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
      emit(SearchInitial());
      return;
    }

    emit(SearchLoading());
    try {
      List<Team> teams = [];
      List<League> leagues = [];

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

      emit(SearchLoaded(
        teams: teams,
        leagues: leagues,
      ));
    } catch (e) {
      emit(SearchError(e.toString()));
    }
  }
}
