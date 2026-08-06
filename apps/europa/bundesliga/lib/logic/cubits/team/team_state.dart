part of 'team_cubit.dart';

abstract class TeamState {}

class TeamInitial extends TeamState {}

class TeamLoading extends TeamState {}

class TeamLoaded extends TeamState {
  final List<Fixture> fixtures;
  final List<Standing> standings;
  final Map<String, dynamic>? stats;
  final String? leagueName;
  final List<SquadPlayer> squad;

  TeamLoaded({
    required this.fixtures,
    this.standings = const [],
    this.stats,
    this.leagueName,
    this.squad = const [],
  });
}

class TeamError extends TeamState {
  final String message;
  TeamError(this.message);
}
