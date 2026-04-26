import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/standing.dart';

part 'team_state.dart';

class TeamCubit extends Cubit<TeamState> {
  final ApiClient apiClient;

  TeamCubit(this.apiClient) : super(TeamInitial());

  Future<void> fetchTeamData(int teamExternalId) async {
    emit(TeamLoading());
    try {
      final fixtures = await apiClient.getTeamFixtures(teamExternalId.toString());
      List<Standing> standings = [];
      Map<String, dynamic>? stats;

      if (fixtures.isNotEmpty) {
        final leagueExternalId = fixtures.first.league?.externalId;
        if (leagueExternalId != null) {
          standings = await apiClient.getStandings(leagueExternalId);
          stats = await apiClient.getTeamStats(teamExternalId.toString(), leagueExternalId);
        }
      }

      emit(TeamLoaded(
        fixtures: fixtures,
        standings: standings,
        stats: stats,
      ));
    } catch (e) {
      emit(TeamError(e.toString()));
    }
  }
}
