part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '624';
  static const int externalLeagueId = 624;
  static const String appName = 'Campeonato Carioca';
  static const String appSlug = 'campeonato_carioca';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/624.png';

  // Competições do Campeonato Carioca
  static const int cariocaSerieAId = 624;
  static const int cariocaSerieA2Id = 851;
  static const List<int> supportedLeagueIds = [624, 851];
}
