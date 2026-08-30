import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/team.dart';
import '../../models/league.dart';
import '../../models/fixture.dart';
import '../../../helpers/helpers.dart';

part 'search_state.dart';

class SearchCubit extends Cubit<SearchState> {
  final ApiClient apiClient;

  SearchCubit(this.apiClient) : super(SearchInitial());

  Future<void> search(String query) async {
    final serieaId = AppConfig.externalLeagueId;
    if (query.isEmpty) {
      emit(SearchLoading());
      try {
        final leagues = await apiClient.getStoredLeagues();
        final serieaLeagues = leagues.where((l) => l.externalId == serieaId).toList();
        emit(SearchLoaded(
          teams: [],
          leagues: serieaLeagues.isNotEmpty ? serieaLeagues : leagues,
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
          return country == 'italy' || country == 'itália' || country == 'italia';
        }).toList();
      } catch (e) {
        print('Error searching teams: $e');
      }

      try {
        final rawLeagues = await apiClient.searchLeagues(query);
        leagues = rawLeagues.where((l) {
          final country = l.country?.toLowerCase() ?? '';
          final isItaly = country == 'italy' || country == 'itália' || country == 'italia';
          return l.externalId == serieaId || isItaly;
        }).toList();
      } catch (e) {
        print('Error searching leagues: $e');
      }

      try {
        final rawFixtures = await apiClient.searchFixtures(query);
        fixtures = rawFixtures.where((f) {
          final extId = f.league?.externalId ?? int.tryParse(f.leagueId);
          return extId == serieaId;
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
      emit(SearchError('Não foi possível carregar os resultados da busca. Verifique sua conexão.'));
    }
  }

  void clear() {
    emit(SearchInitial());
  }
}
