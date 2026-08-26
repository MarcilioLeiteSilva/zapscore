import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../helpers/helpers.dart';
import '../../../repository/api/api_client.dart';
import '../../models/home_competition.dart';
import '../../models/fixture.dart';
import '../../models/league.dart';

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

      const gauchoIds = AppConfig.supportedLeagueIds;
      final targetLeagues = leagues.where((l) => gauchoIds.contains(l.externalId)).toList();

      if (targetLeagues.isNotEmpty) {
        for (var league in targetLeagues) {
          List<Fixture> matches = await apiClient.getFixturesByDate(league.externalId, formattedDate);
          competitions.add(HomeCompetition(league: league, matches: matches));
        }
      } else {
        // Fallback com as ligas do Gaúcho
        final fallbackLeagues = [
          League(
            id: '477',
            externalId: 477,
            name: 'Gaúcho Série A',
            country: 'Brazil',
            logo: 'https://media.api-sports.io/football/leagues/477.png',
          ),
          League(
            id: '478',
            externalId: 478,
            name: 'Gaúcho Divisão de Acesso',
            country: 'Brazil',
            logo: 'https://media.api-sports.io/football/leagues/478.png',
          ),
        ];

        for (var fLeague in fallbackLeagues) {
          List<Fixture> matches = await apiClient.getFixturesByDate(fLeague.externalId, formattedDate);
          competitions.add(HomeCompetition(league: fLeague, matches: matches));
        }
      }

      emit(HomeLoaded(competitions));
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }
}
