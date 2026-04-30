part of 'fixture_cubit.dart';

abstract class FixtureState {}

class FixtureInitial extends FixtureState {}

class FixtureLoading extends FixtureState {}

class FixtureLoaded extends FixtureState {
  final Fixture fixture;
  final List<Standing> standings;
  final Standing? homeStanding;
  final Standing? awayStanding;
  FixtureLoaded(this.fixture, {this.standings = const [], this.homeStanding, this.awayStanding});
}

class FixtureError extends FixtureState {
  final String message;
  FixtureError(this.message);
}
