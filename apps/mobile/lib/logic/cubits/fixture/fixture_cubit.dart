import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';

part 'fixture_state.dart';

class FixtureCubit extends Cubit<FixtureState> {
  final ApiClient apiClient;

  FixtureCubit(this.apiClient) : super(FixtureInitial());

  Future<void> fetchFixtureDetails(String id) async {
    emit(FixtureLoading());
    try {
      final fixture = await apiClient.getFixtureDetails(id);
      emit(FixtureLoaded(fixture));
    } catch (e) {
      emit(FixtureError(e.toString()));
    }
  }
}
