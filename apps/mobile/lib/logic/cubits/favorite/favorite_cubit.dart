import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../../repository/locale/favorite_repository.dart';
import '../../models/fixture.dart';
import '../../models/league.dart';
import '../../models/team.dart';

part 'favorite_state.dart';

class FavoriteCubit extends Cubit<FavoriteState> {
  final FavoriteRepository favoriteRepository;
  final ApiClient apiClient;

  FavoriteCubit({
    required this.favoriteRepository,
    required this.apiClient,
  }) : super(FavoriteInitial());

  Future<void> init() async {
    await loadFavoriteIds();
  }

  Future<void> loadFavoriteIds() async {
    final teams = await favoriteRepository.getFavoriteTeams();
    final leagues = await favoriteRepository.getFavoriteLeagues();
    final fixtures = await favoriteRepository.getFavoriteFixtures();

    emit(FavoriteInitial()); // Temporary until we fetch full data
    // In a real app, you might fetch details here or just IDs
    await fetchFavoriteDetails(teams, leagues, fixtures);
  }

  Future<void> fetchFavoriteDetails(
    List<String> teamIds,
    List<String> leagueIds,
    List<String> fixtureIds,
  ) async {
    emit(FavoriteLoading(
      favoriteTeamIds: teamIds,
      favoriteLeagueIds: leagueIds,
      favoriteFixtureIds: fixtureIds,
    ));

    try {
      // Fetch Fixtures
      List<Fixture> fixtures = [];
      for (var id in fixtureIds) {
        try {
          final fix = await apiClient.getFixtureDetails(id);
          fixtures.add(fix);
        } catch (e) {
          print('Error fetching favorite fixture $id: $e');
        }
      }

      // Fetch Leagues (get all stored and filter)
      final allLeagues = await apiClient.getStoredLeagues();
      final leagues = allLeagues.where((l) => leagueIds.contains(l.externalId.toString())).toList();

      // Fetch Teams (TODO: Implement getTeamDetails if API supports it)
      List<Team> teams = []; // Placeholder for now

      emit(FavoriteLoaded(
        favoriteTeamIds: teamIds,
        favoriteLeagueIds: leagueIds,
        favoriteFixtureIds: fixtureIds,
        favoriteFixtures: fixtures,
        favoriteLeagues: leagues,
        favoriteTeams: teams,
      ));
    } catch (e) {
      emit(FavoriteError(e.toString(),
          favoriteTeamIds: teamIds,
          favoriteLeagueIds: leagueIds,
          favoriteFixtureIds: fixtureIds));
    }
  }

  Future<void> toggleFixture(String id) async {
    await favoriteRepository.toggleFixture(id);
    await loadFavoriteIds();
  }

  Future<void> toggleLeague(String id) async {
    await favoriteRepository.toggleLeague(id);
    await loadFavoriteIds();
  }

  Future<void> toggleTeam(String id) async {
    await favoriteRepository.toggleTeam(id);
    await loadFavoriteIds();
  }

  bool isFixtureFavorite(String id) {
    return state.favoriteFixtureIds.contains(id);
  }

  bool isLeagueFavorite(String id) {
    return state.favoriteLeagueIds.contains(id);
  }

  bool isTeamFavorite(String id) {
    return state.favoriteTeamIds.contains(id);
  }
}
