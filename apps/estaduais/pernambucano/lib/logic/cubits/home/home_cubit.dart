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

      const pernambucanoIds = AppConfig.supportedLeagueIds;
      final targetLeagues = leagues.where((l) => pernambucanoIds.contains(l.externalId)).toList();

      if (targetLeagues.isNotEmpty) {
        for (var league in targetLeagues) {
          List<Fixture> matches = await apiClient.getFixturesByDate(league.externalId, formattedDate);
          competitions.add(HomeCompetition(league: league, matches: matches));
        }
      } else {
        // Fallback com as ligas do Campeonato Pernambucano
        final fallbackLeagues = [
          League(
            id: '622',
            externalId: 622,
            name: 'Pernambucano 1',
            country: 'Brazil',
            logo: 'https://media.api-sports.io/football/leagues/622.png',
          ),
          League(
            id: '1125',
            externalId: 1125,
            name: 'Pernambucano 2',
            country: 'Brazil',
            logo: 'https://media.api-sports.io/football/leagues/1125.png',
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
