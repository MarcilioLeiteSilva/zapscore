part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '622';
  static const int externalLeagueId = 622;
  static const String appName = 'Campeonato Gaúcho';
  static const String appSlug = 'campeonato_gaucho';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://media.api-sports.io/football/leagues/622.png';

  // Competições do Campeonato Gaúcho
  static const int gauchoSerieAId = 622;
  static const int gauchoDivisaoAcessoId = 853;
  static const List<int> supportedLeagueIds = [622, 853];
}
