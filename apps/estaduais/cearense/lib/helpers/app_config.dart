part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '609';
  static const int externalLeagueId = 609;
  static const String appName = 'Campeonato Cearense';
  static const String appSlug = 'campeonato_cearense';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/609.png';

  // Competições do Campeonato Cearense
  static const int cearenseSerieAId = 609;
  static const int cearenseSerieBId = 620;
  static const List<int> supportedLeagueIds = [609, 620];
}
