part of 'fixture_cubit.dart';

abstract class FixtureState {}

class FixtureInitial extends FixtureState {}

class FixtureLoading extends FixtureState {}

class FixtureLoaded extends FixtureState {
  final Fixture fixture;
  final List<Standing> standings;
  final Standing? homeStanding;
  final Standing? awayStanding;
  final Map<String, dynamic>? h2hData;
  FixtureLoaded(this.fixture, {this.standings = const [], this.homeStanding, this.awayStanding, this.h2hData});
}

class FixtureError extends FixtureState {
  final String message;
  FixtureError(this.message);
}
