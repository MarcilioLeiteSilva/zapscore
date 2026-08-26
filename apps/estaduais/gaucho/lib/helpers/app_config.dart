part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '477';
  static const int externalLeagueId = 477;
  static const String appName = 'Campeonato Gaúcho';
  static const String appSlug = 'campeonato_gaucho';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/477.png';

  // Competições do Campeonato Gaúcho
  static const int gauchoSerieAId = 477;
  static const int gauchoDivisaoAcessoId = 478;
  static const List<int> supportedLeagueIds = [477, 478];
}
