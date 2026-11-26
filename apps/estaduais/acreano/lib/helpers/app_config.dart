part of 'helpers.dart';

class AppConfig {
  static const String leagueId = '520';
  static const int externalLeagueId = 520;
  static const String appName = 'Campeonato Acreano';
  static const String appSlug = 'campeonato_acreano';
  static const String apiBaseUrl = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';
  static const String pocketbaseBaseUrl = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  static const String defaultLeagueLogo = 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/520.png';

  // Temporada ativa padrão
  static const int season = 2027;
  static const int defaultSeason = 2027;

  // Competições Suportadas
  static const int principalLeagueId = 520;
  static const int acreanoSerieAId = 520;
  static const List<int> supportedLeagueIds = [520];
}
