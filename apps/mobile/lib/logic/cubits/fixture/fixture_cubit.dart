import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';

part 'fixture_state.dart';

class FixtureCubit extends Cubit<FixtureState> {
  final ApiClient apiClient;
  Timer? _refreshTimer;

  FixtureCubit(this.apiClient) : super(FixtureInitial());

  Future<void> fetchFixtureDetails(String id, {bool isAutoRefresh = false}) async {
    if (!isAutoRefresh) {
      emit(FixtureLoading());
    }
    try {
      final fixture = await apiClient.getFixtureDetails(id);
      emit(FixtureLoaded(fixture));
      
      // Se o jogo estiver ao vivo ou NS (perto do início) e não tiver escalações, tenta forçar um sync no backend
      if ((isLive(fixture.statusShort) || fixture.statusShort == 'NS') && fixture.lineups.isEmpty) {
         apiClient.syncFixture(fixture.externalId).then((_) {
            // Recarrega os detalhes após o sync (silenciosamente)
            apiClient.getFixtureDetails(id).then((updated) {
               if (state is FixtureLoaded) {
                 emit(FixtureLoaded(updated));
               }
            });
         });
      }

      // Se o jogo estiver ao vivo, inicia o auto-refresh se ainda não estiver rodando
      if (isLive(fixture.statusShort) && _refreshTimer == null) {
        startAutoRefresh(id);
      } else if (!isLive(fixture.statusShort)) {
        stopAutoRefresh();
      }
    } catch (e) {
      if (!isAutoRefresh) {
        emit(FixtureError(e.toString()));
      }
    }
  }

  void startAutoRefresh(String id, {int seconds = 60}) {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(Duration(seconds: seconds), (timer) {
      fetchFixtureDetails(id, isAutoRefresh: true);
    });
  }

  void stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  bool isLive(String? status) {
    if (status == null) return false;
    final liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
    return liveStatuses.contains(status);
  }

  @override
  Future<void> close() {
    stopAutoRefresh();
    return super.close();
  }
}
