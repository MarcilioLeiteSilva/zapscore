part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '629';
  static const int externalLeagueId = 629;
  static const String appName = 'Campeonato Mineiro';
  static const String appSlug = 'campeonato_mineiro';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/629.png';

  // Competições do Campeonato Mineiro
  static const int mineiroModulo1Id = 629;
  static const int mineiroModulo2Id = 619;
  static const List<int> supportedLeagueIds = [629, 619];
}
