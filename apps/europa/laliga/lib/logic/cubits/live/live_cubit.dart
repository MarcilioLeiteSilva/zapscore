import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';

part 'live_state.dart';

class LiveCubit extends Cubit<LiveState> {
  final ApiClient apiClient;
  Timer? _refreshTimer;

  LiveCubit(this.apiClient) : super(LiveInitial());

  Future<void> fetchLiveFixtures({bool isAutoRefresh = false}) async {
    if (!isAutoRefresh) {
      emit(LiveLoading());
    }
    try {
      final fixtures = await apiClient.getLiveFixtures(leagueId: 140);
      final laligaFixtures = fixtures.where((f) {
        final extId = f.league?.externalId;
        final id = f.league?.id;
        final name = f.league?.name.toLowerCase() ?? '';
        return extId == 140 || id == '140' || name.contains('la liga') || name.contains('laliga');
      }).toList();
      emit(LiveLoaded(laligaFixtures));
    } catch (e) {
      if (!isAutoRefresh) {
        emit(LiveError(e.toString()));
      }
    }
  }

  void startAutoRefresh({int seconds = 60}) {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(Duration(seconds: seconds), (timer) {
      fetchLiveFixtures(isAutoRefresh: true);
    });
  }

  void stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  @override
  Future<void> close() {
    stopAutoRefresh();
    return super.close();
  }
}
