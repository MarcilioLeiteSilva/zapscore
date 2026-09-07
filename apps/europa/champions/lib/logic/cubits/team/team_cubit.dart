import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/scorer.dart';
import '../../models/squad_player.dart';
import '../../models/standing.dart';

part 'team_state.dart';

class TeamCubit extends Cubit<TeamState> {
  final ApiClient apiClient;

  TeamCubit(this.apiClient) : super(TeamInitial());

  Future<void> fetchTeamData(int teamExternalId, {int? preferredLeagueId, String? teamName}) async {
    emit(TeamLoading());
    try {
      var fixtures = await apiClient.getTeamFixtures(teamExternalId.toString());
      
      if (preferredLeagueId != null) {
        fixtures = fixtures.where((f) => f.league?.externalId == preferredLeagueId).toList();
      }

      List<Standing> standings = [];
      Map<String, dynamic>? stats;
      List<Scorer> teamScorers = [];

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

        try {
          final allScorers = await apiClient.getScorers(leagueId);
          final rawName = teamName ??
              stats?['team']?['name'] ??
              (fixtures.isNotEmpty
                  ? (fixtures.first.homeTeam?.externalId == teamExternalId
                      ? fixtures.first.homeTeam?.name
                      : fixtures.first.awayTeam?.name)
                  : null);

          if (rawName != null && rawName.toString().trim().isNotEmpty) {
            final cleanName = rawName.toString().trim().toLowerCase();
            teamScorers = allScorers.where((s) {
              final sTeam = s.teamName.trim().toLowerCase();
              return sTeam == cleanName ||
                  sTeam.contains(cleanName) ||
                  cleanName.contains(sTeam);
            }).toList();
          }
        } catch (_) {}
      }

      List<SquadPlayer> squad = [];
      try {
        squad = await apiClient.getSquad(teamExternalId);
      } catch (_) {}

      emit(TeamLoaded(
        fixtures: fixtures,
        standings: standings,
        stats: stats,
        leagueName: leagueName,
        squad: squad,
        teamScorers: teamScorers,
      ));
    } catch (e) {
      emit(TeamError(e.toString()));
    }
  }
}
