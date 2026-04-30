import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/standing.dart';

part 'team_state.dart';

class TeamCubit extends Cubit<TeamState> {
  final ApiClient apiClient;

  TeamCubit(this.apiClient) : super(TeamInitial());

  Future<void> fetchTeamData(int teamExternalId, {int? preferredLeagueId}) async {
    emit(TeamLoading());
    try {
      var fixtures = await apiClient.getTeamFixtures(teamExternalId.toString());
      
      if (preferredLeagueId != null) {
        fixtures = fixtures.where((f) => f.league?.externalId == preferredLeagueId).toList();
      }

      List<Standing> standings = [];
      Map<String, dynamic>? stats;

      int? leagueId = preferredLeagueId;
      String? leagueName;
      if (leagueId == null && fixtures.isNotEmpty) {
        leagueId = fixtures.first.league?.externalId;
        leagueName = fixtures.first.league?.name;
      } else if (leagueId != null && fixtures.isNotEmpty) {
        final f = fixtures.where((f) => f.league?.externalId == leagueId);
        if (f.isNotEmpty) {
          leagueName = f.first.league?.name;
        }
      }

      if (leagueId != null) {
        standings = await apiClient.getStandings(leagueId);
        stats = await apiClient.getTeamStats(teamExternalId.toString(), leagueId);
      }

      emit(TeamLoaded(
        fixtures: fixtures,
        standings: standings,
        stats: stats,
        leagueName: leagueName,
      ));
    } catch (e) {
      emit(TeamError(e.toString()));
    }
  }
}
