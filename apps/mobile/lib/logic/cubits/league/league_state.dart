part of 'league_cubit.dart';

abstract class LeagueState {}

class LeagueInitial extends LeagueState {}

class LeagueLoading extends LeagueState {}

class LeagueLoaded extends LeagueState {
  final List<Fixture> fixtures;
  final List<Standing> standings;
  final List<Scorer> scorers;
  final List<String> rounds;
  final String selectedRound;

  LeagueLoaded({
    required this.fixtures,
    required this.standings,
    required this.scorers,
    required this.rounds,
    required this.selectedRound,
  });

  LeagueLoaded copyWith({
    List<Fixture>? fixtures,
    List<Standing>? standings,
    List<Scorer>? scorers,
    List<String>? rounds,
    String? selectedRound,
  }) {
    return LeagueLoaded(
      fixtures: fixtures ?? this.fixtures,
      standings: standings ?? this.standings,
      scorers: scorers ?? this.scorers,
      rounds: rounds ?? this.rounds,
      selectedRound: selectedRound ?? this.selectedRound,
    );
  }
}

class LeagueError extends LeagueState {
  final String message;
  LeagueError(this.message);
}
