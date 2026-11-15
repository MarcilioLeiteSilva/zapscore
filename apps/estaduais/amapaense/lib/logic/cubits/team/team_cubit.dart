import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/squad_player.dart';
import '../../models/standing.dart';
import '../../engines/competition_normalizer.dart';
import '../../engines/amapaense_squads.dart';

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

      // Fallback para as partidas canônicas da temporada 2027 do Amapaense
      if (fixtures.isEmpty) {
        final all2027Matches = CompetitionNormalizer.canonicalAmapaenseFixtures;
        fixtures = all2027Matches.where((f) =>
          f.homeTeam?.externalId == teamExternalId ||
          f.awayTeam?.externalId == teamExternalId ||
          f.homeTeamId == teamExternalId.toString() ||
          f.awayTeamId == teamExternalId.toString()
        ).toList();
      }

      List<Standing> standings = [];
      Map<String, dynamic>? stats;

      int leagueId = preferredLeagueId ?? 521;
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
        standings = await apiClient.getStandings(leagueId, season: 2027);
      } catch (_) {}

      // Fallback para classificação canônica do Amapaense 2027
      if (standings.isEmpty) {
        standings = CompetitionNormalizer.canonicalAmapaenseStandings;
      }

      try {
        stats = await apiClient.getTeamStats(teamExternalId.toString(), leagueId, season: 2027);
      } catch (_) {}

      List<SquadPlayer> squad = [];
      try {
        squad = await apiClient.getSquad(teamExternalId);
      } catch (_) {}

      // Fallback para o plantel canônico dos clubes do Amapaense
      if (squad.isEmpty) {
        squad = AmapaenseSquads.getSquad(teamExternalId);
      }

      emit(TeamLoaded(
        fixtures: fixtures,
        standings: standings,
        stats: stats,
        leagueName: leagueName,
        squad: squad,
      ));
    } catch (e) {
      // Fallback gracioso com plantel e partidas canônicas
      final fallbackSquad = AmapaenseSquads.getSquad(teamExternalId);
      final all2027Matches = CompetitionNormalizer.canonicalAmapaenseFixtures;
      final fallbackFixtures = all2027Matches.where((f) =>
        f.homeTeam?.externalId == teamExternalId ||
        f.awayTeam?.externalId == teamExternalId
      ).toList();

      if (fallbackSquad.isNotEmpty || fallbackFixtures.isNotEmpty) {
        emit(TeamLoaded(
          fixtures: fallbackFixtures,
          standings: CompetitionNormalizer.canonicalAmapaenseStandings,
          stats: null,
          leagueName: 'Campeonato Amapaense',
          squad: fallbackSquad,
        ));
      } else {
        emit(TeamError(e.toString()));
      }
    }
  }
}
