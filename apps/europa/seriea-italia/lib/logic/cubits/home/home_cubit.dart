import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/home_competition.dart';
import '../../models/fixture.dart';
import '../../../helpers/helpers.dart';

part 'home_state.dart';

class HomeCubit extends Cubit<HomeState> {
  final ApiClient apiClient;

  HomeCubit(this.apiClient) : super(HomeInitial());

  Future<void> fetchHomeData({DateTime? date}) async {
    emit(HomeLoading());
    try {
      final leagues = await apiClient.getStoredLeagues();
      final List<HomeCompetition> competitions = [];

      final targetDate = date ?? DateTime.now();
      final formattedDate = "${targetDate.year}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}";

      final serieaId = AppConfig.externalLeagueId;
      final targetLeagues = leagues.where((l) => l.externalId == serieaId).toList();

      if (targetLeagues.isNotEmpty) {
        for (var league in targetLeagues) {
          List<Fixture> matches = await apiClient.getFixturesByDate(league.externalId, formattedDate);
          competitions.add(HomeCompetition(league: league, matches: matches));
        }
      } else {
        // Fallback se getStoredLeagues retornar lista ainda sem ID
        List<Fixture> matches = await apiClient.getFixturesByDate(serieaId, formattedDate);
        final dummyLeague = leagues.firstWhere((l) => l.externalId == serieaId, orElse: () => leagues.first);
        competitions.add(HomeCompetition(league: dummyLeague, matches: matches));
      }

      emit(HomeLoaded(competitions));
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }
}
