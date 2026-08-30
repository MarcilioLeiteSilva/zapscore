part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '606';
  static const int externalLeagueId = 606;
  static const String appName = 'Campeonato Paranaense';
  static const String appSlug = 'campeonato_paranaense';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/606.png';

  // Competições do Campeonato Paranaense
  static const int paranaenseSerieAId = 606;
  static const int paranaenseSerieBId = 614;
  static const List<int> supportedLeagueIds = [606, 614];
}
