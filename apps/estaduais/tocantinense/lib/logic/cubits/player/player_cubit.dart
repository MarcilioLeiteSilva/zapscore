import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import 'player_state.dart';

class PlayerCubit extends Cubit<PlayerState> {
  final ApiClient apiClient;

  PlayerCubit(this.apiClient) : super(PlayerInitial());

  Future<void> fetchPlayerDetails(int playerId, {int? season}) async {
    emit(PlayerLoading());
    try {
      final player = await apiClient.getPlayerDetails(playerId, season: season);
      if (player != null) {
        emit(PlayerLoaded(player));
      } else {
        emit(PlayerError('Perfil do jogador não encontrado'));
      }
    } catch (e) {
      emit(PlayerError('Erro ao carregar dados do jogador: $e'));
    }
  }
}
