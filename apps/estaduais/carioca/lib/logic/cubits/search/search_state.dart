part of 'search_cubit.dart';

abstract class SearchState {}

class SearchInitial extends SearchState {}

class SearchLoading extends SearchState {}

class SearchLoaded extends SearchState {
  final List<Team> teams;
  final List<League> leagues;
  final List<Fixture> fixtures;

  SearchLoaded({
    this.teams = const [],
    this.leagues = const [],
    this.fixtures = const []
  });
}

class SearchError extends SearchState {
  final String message;
  SearchError(this.message);
}
