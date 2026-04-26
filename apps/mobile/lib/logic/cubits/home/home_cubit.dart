import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/home_competition.dart';
import '../../models/fixture.dart';

part 'home_state.dart';

class HomeCubit extends Cubit<HomeState> {
  final ApiClient apiClient;

  HomeCubit(this.apiClient) : super(HomeInitial());

  Future<void> fetchHomeData({DateTime? date}) async {
    emit(HomeLoading());
    try {
      final leagues = await apiClient.getStoredLeagues();
      final List<HomeCompetition> competitions = [];

      for (var league in leagues) {
        List<Fixture> matches = [];
        if (date != null) {
          final formattedDate = "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
          matches = await apiClient.getFixturesByDate(league.externalId, formattedDate);
        } else {
          // Default logic for "Today" - get all today's matches or recent if none
          matches = await apiClient.getTodayFixtures(league.externalId);
          if (matches.isEmpty) {
            final match = await apiClient.getFixtureWithMatchLogic(league.externalId);
            if (match != null) matches.add(match);
          }
        }
        
        if (matches.isNotEmpty || date == null) {
          competitions.add(HomeCompetition(league: league, matches: matches));
        }
      }

      emit(HomeLoaded(competitions));
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }
}
