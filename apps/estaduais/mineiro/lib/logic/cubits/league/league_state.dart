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

  // Novos campos do Motor de Competições
  final Competition? competition;
  final int selectedLeagueId;
  final String selectedPhaseId;
  final int selectedGroupIndex;

  LeagueLoaded({
    required this.fixtures,
    required this.standings,
    required this.scorers,
    required this.rounds,
    required this.selectedRound,
    this.competition,
    this.selectedLeagueId = 624,
    this.selectedPhaseId = 'taca_guanabara',
    this.selectedGroupIndex = 0,
  });

  CompetitionPhase? get activePhase => competition?.getPhase(selectedPhaseId);

  LeagueLoaded copyWith({
    List<Fixture>? fixtures,
    List<Standing>? standings,
    List<Scorer>? scorers,
    List<String>? rounds,
    String? selectedRound,
    Competition? competition,
    int? selectedLeagueId,
    String? selectedPhaseId,
    int? selectedGroupIndex,
  }) {
    return LeagueLoaded(
      fixtures: fixtures ?? this.fixtures,
      standings: standings ?? this.standings,
      scorers: scorers ?? this.scorers,
      rounds: rounds ?? this.rounds,
      selectedRound: selectedRound ?? this.selectedRound,
      competition: competition ?? this.competition,
      selectedLeagueId: selectedLeagueId ?? this.selectedLeagueId,
      selectedPhaseId: selectedPhaseId ?? this.selectedPhaseId,
      selectedGroupIndex: selectedGroupIndex ?? this.selectedGroupIndex,
    );
  }
}

class LeagueError extends LeagueState {
  final String message;
  LeagueError(this.message);
}
