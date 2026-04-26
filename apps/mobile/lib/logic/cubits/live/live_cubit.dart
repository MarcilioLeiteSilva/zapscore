import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';

part 'live_state.dart';

class LiveCubit extends Cubit<LiveState> {
  final ApiClient apiClient;

  LiveCubit(this.apiClient) : super(LiveInitial());

  Future<void> fetchLiveFixtures() async {
    emit(LiveLoading());
    try {
      final fixtures = await apiClient.getLiveFixtures();
      emit(LiveLoaded(fixtures));
    } catch (e) {
      emit(LiveError(e.toString()));
    }
  }
}
