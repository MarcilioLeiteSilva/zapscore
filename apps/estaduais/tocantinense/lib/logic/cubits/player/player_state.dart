import '../../models/player.dart';

abstract class PlayerState {}

class PlayerInitial extends PlayerState {}

class PlayerLoading extends PlayerState {}

class PlayerLoaded extends PlayerState {
  final PlayerProfile player;
  PlayerLoaded(this.player);
}

class PlayerError extends PlayerState {
  final String message;
  PlayerError(this.message);
}
