import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/squad_player.dart';
import '../../models/standing.dart';
import '../../engines/competition_normalizer.dart';
import '../../engines/amazonense_squads.dart';

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

      // Filtra partidas prioritariamente da temporada ativa 2027
      if (fixtures.any((f) => f.season == 2027)) {
        fixtures = fixtures.where((f) => f.season == 2027).toList();
      }

      // Se a API não tiver partidas do clube cadastradas para 2027, usa a tabela oficial da FAF
      if (fixtures.isEmpty) {
        final all2027Matches = CompetitionNormalizer.canonicalAmazonenseFixtures;
        fixtures = all2027Matches.where((f) =>
          f.homeTeam?.externalId == teamExternalId ||
          f.awayTeam?.externalId == teamExternalId
        ).toList();
      }

      List<Standing> standings = [];
      Map<String, dynamic>? stats;

      int leagueId = preferredLeagueId ?? 522;
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

      // Fallback para classificação canônica do Amazonense 2027
      if (standings.isEmpty) {
        standings = CompetitionNormalizer.canonicalAmazonenseStandings;
      }

      try {
        stats = await apiClient.getTeamStats(teamExternalId.toString(), leagueId, season: 2027);
      } catch (_) {}

      List<SquadPlayer> squad = [];
      try {
        squad = await apiClient.getSquad(teamExternalId);
      } catch (_) {}

      // Fallback para o plantel canônico dos clubes do Amazonense
      if (squad.isEmpty) {
        squad = AmazonenseSquads.getSquad(teamExternalId);
      }

      emit(TeamLoaded(
        fixtures: fixtures,
        standings: standings,
        stats: stats,
        leagueName: leagueName ?? 'Campeonato Amazonense',
        squad: squad,
      ));
    } catch (e) {
      // Fallback gracioso com plantel e partidas canônicas
      final fallbackSquad = AmazonenseSquads.getSquad(teamExternalId);
      final all2027Matches = CompetitionNormalizer.canonicalAmazonenseFixtures;
      final fallbackFixtures = all2027Matches.where((f) =>
        f.homeTeam?.externalId == teamExternalId ||
        f.awayTeam?.externalId == teamExternalId
      ).toList();

      if (fallbackSquad.isNotEmpty || fallbackFixtures.isNotEmpty) {
        emit(TeamLoaded(
          fixtures: fallbackFixtures,
          standings: CompetitionNormalizer.canonicalAmazonenseStandings,
          stats: null,
          leagueName: 'Campeonato Amazonense',
          squad: fallbackSquad,
        ));
      } else {
        emit(TeamError(e.toString()));
      }
    }
  }
}
