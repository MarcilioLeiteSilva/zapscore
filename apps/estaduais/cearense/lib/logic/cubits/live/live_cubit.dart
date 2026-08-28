import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../helpers/helpers.dart';
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
      final fixtures = await apiClient.getLiveFixtures();
      const cearenseIds = AppConfig.supportedLeagueIds;
      final cearenseFixtures = fixtures.where((f) {
        final extId = f.league?.externalId;
        final id = f.league?.id;
        final name = f.league?.name.toLowerCase() ?? '';
        return (extId != null && cearenseIds.contains(extId)) ||
            cearenseIds.any((cid) => id == '$cid') ||
            name.contains('cearense');
      }).toList();
      emit(LiveLoaded(cearenseFixtures));
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
