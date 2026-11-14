import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/squad_player.dart';
import '../../models/standing.dart';
import '../../engines/tocantinense_squads.dart';

part 'team_state.dart';

class TeamCubit extends Cubit<TeamState> {
  final ApiClient apiClient;

  TeamCubit(this.apiClient) : super(TeamInitial());

  Future<void> fetchTeamData(int teamExternalId, {int? preferredLeagueId}) async {
    emit(TeamLoading());
    try {
      var fixtures = <Fixture>[];
      try {
        fixtures = await apiClient.getTeamFixtures(teamExternalId.toString());
        if (preferredLeagueId != null) {
          fixtures = fixtures.where((f) => f.league?.externalId == preferredLeagueId).toList();
        }
      } catch (_) {}

      List<Standing> standings = [];
      Map<String, dynamic>? stats;

      int leagueId = preferredLeagueId ?? 631;
      String? leagueName;
      if (fixtures.isNotEmpty) {
        final f = fixtures.where((f) => f.league?.externalId == leagueId);
        if (f.isNotEmpty) {
          leagueName = f.first.league?.name;
        } else {
          leagueName = fixtures.first.league?.name;
        }
      }

      try {
        standings = await apiClient.getStandings(leagueId);
      } catch (_) {}

      try {
        stats = await apiClient.getTeamStats(teamExternalId.toString(), leagueId);
      } catch (_) {}

      List<SquadPlayer> squad = [];
      try {
        squad = await apiClient.getSquad(teamExternalId);
      } catch (_) {}

      // Fallback para o plantel canônico dos clubes do Tocantinense
      if (squad.isEmpty) {
        squad = TocantinenseSquads.getSquad(teamExternalId);
      }

      emit(TeamLoaded(
        fixtures: fixtures,
        standings: standings,
        stats: stats,
        leagueName: leagueName,
        squad: squad,
      ));
    } catch (e) {
      // Garantir fallback com o elenco canônico mesmo em caso de exceção de rede
      final fallbackSquad = TocantinenseSquads.getSquad(teamExternalId);
      if (fallbackSquad.isNotEmpty) {
        emit(TeamLoaded(
          fixtures: const [],
          standings: const [],
          stats: null,
          leagueName: null,
          squad: fallbackSquad,
        ));
      } else {
        emit(TeamError(e.toString()));
      }
    }
  }
}
