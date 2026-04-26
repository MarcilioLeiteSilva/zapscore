part of 'favorite_cubit.dart';

abstract class FavoriteState {
  final List<String> favoriteTeamIds;
  final List<String> favoriteLeagueIds;
  final List<String> favoriteFixtureIds;

  FavoriteState({
    this.favoriteTeamIds = const [],
    this.favoriteLeagueIds = const [],
    this.favoriteFixtureIds = const [],
  });
}

class FavoriteInitial extends FavoriteState {
  FavoriteInitial() : super();
}

class FavoriteLoading extends FavoriteState {
  FavoriteLoading({
    super.favoriteTeamIds,
    super.favoriteLeagueIds,
    super.favoriteFixtureIds,
  });
}

class FavoriteLoaded extends FavoriteState {
  final List<Team> favoriteTeams;
  final List<League> favoriteLeagues;
  final List<Fixture> favoriteFixtures;

  FavoriteLoaded({
    required super.favoriteTeamIds,
    required super.favoriteLeagueIds,
    required super.favoriteFixtureIds,
    this.favoriteTeams = const [],
    this.favoriteLeagues = const [],
    this.favoriteFixtures = const [],
  });
}

class FavoriteError extends FavoriteState {
  final String message;
  FavoriteError(this.message, {
    super.favoriteTeamIds,
    super.favoriteLeagueIds,
    super.favoriteFixtureIds,
  });
}
