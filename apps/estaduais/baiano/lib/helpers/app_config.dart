part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '602';
  static const int externalLeagueId = 602;
  static const String appName = 'Campeonato Baiano';
  static const String appSlug = 'campeonato_baiano';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/602.png';

  // Competições do Campeonato Baiano
  static const int baianoSerieAId = 602;
  static const int baianoSerieBId = 613;
  static const List<int> supportedLeagueIds = [602, 613];
}
