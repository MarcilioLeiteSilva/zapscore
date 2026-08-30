part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '475';
  static const int externalLeagueId = 475;
  static const String appName = 'Campeonato Paulista';
  static const String appSlug = 'campeonato_paulista';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/475.png';

  // Competições do Campeonato Paulista
  static const int paulistaSerieAId = 475;
  static const int paulistaSerieA2Id = 476;
  static const List<int> supportedLeagueIds = [475, 476];
}
