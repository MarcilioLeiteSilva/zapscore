part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '607';
  static const int externalLeagueId = 607;
  static const String appName = 'Campeonato Cearense';
  static const String appSlug = 'campeonato_cearense';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/607.png';

  // Competições do Campeonato Cearense
  static const int cearenseSerieAId = 607;
  static const int cearenseSerieBId = 617;
  static const List<int> supportedLeagueIds = [607, 617];
}
