part of 'fixture_cubit.dart';

abstract class FixtureState {}

class FixtureInitial extends FixtureState {}

class FixtureLoading extends FixtureState {}

class FixtureLoaded extends FixtureState {
  final Fixture fixture;
  FixtureLoaded(this.fixture);
}

class FixtureError extends FixtureState {
  final String message;
  FixtureError(this.message);
}
