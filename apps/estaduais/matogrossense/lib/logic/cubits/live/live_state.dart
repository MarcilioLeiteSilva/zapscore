part of 'live_cubit.dart';

abstract class LiveState {}

class LiveInitial extends LiveState {}

class LiveLoading extends LiveState {}

class LiveLoaded extends LiveState {
  final List<Fixture> fixtures;
  LiveLoaded(this.fixtures);
}

class LiveError extends LiveState {
  final String message;
  LiveError(this.message);
}
