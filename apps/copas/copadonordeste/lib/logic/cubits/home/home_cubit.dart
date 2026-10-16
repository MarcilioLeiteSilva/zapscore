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
      List<League> leagues = [];
      try {
        leagues = await apiClient.getStoredLeagues();
      } catch (e) {
        // Se a busca de ligas falhar, usa as ligas fallback locais
      }

      final List<HomeCompetition> competitions = [];

      final targetDate = date ?? DateTime.now();
      final formattedDate = "${targetDate.year}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}";

      const supportedIds = AppConfig.supportedLeagueIds;
      final targetLeagues = leagues.where((l) => supportedIds.contains(l.externalId)).toList();

      if (targetLeagues.isNotEmpty) {
        for (var league in targetLeagues) {
          List<Fixture> matches = await apiClient.getFixturesByDate(league.externalId, formattedDate);
          competitions.add(HomeCompetition(league: league, matches: matches));
        }
      } else {
        // Fallback com a Copa do Nordeste
        final fallbackLeagues = [
          League(
            id: AppConfig.leagueId,
            externalId: AppConfig.externalLeagueId,
            name: AppConfig.appName,
            country: 'Brazil',
            logo: AppConfig.defaultLeagueLogo,
          ),
        ];

        for (var fLeague in fallbackLeagues) {
          List<Fixture> matches = await apiClient.getFixturesByDate(fLeague.externalId, formattedDate);
          competitions.add(HomeCompetition(league: fLeague, matches: matches));
        }
      }

      emit(HomeLoaded(competitions));
    } catch (e) {
      emit(HomeError('Não foi possível carregar os jogos. Verifique sua conexão com a internet.'));
    }
  }
}
