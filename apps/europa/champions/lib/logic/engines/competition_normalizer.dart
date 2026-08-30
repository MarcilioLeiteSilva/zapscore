import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
import '../models/tie.dart';
import '../data/champions_league_2026_data.dart';
import 'standings_engine.dart';
import 'bracket_engine.dart';

class CompetitionNormalizer {
  /// Normaliza dados brutos de API em uma estrutura completa e tipada da UEFA Champions League
  static Competition normalize({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    return _buildChampionsLeague(
      leagueId: leagueId,
      leagueName: leagueName,
      leagueLogo: leagueLogo,
      season: season,
      rawStandings: rawStandings,
      rawFixtures: rawFixtures,
    );
  }

  // --- 🏆 UEFA CHAMPIONS LEAGUE (36 CLUBES - ESTRUTURA OFICIAL 2026/27) ---
  static Competition _buildChampionsLeague({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    final List<CompetitionPhase> phases = [];

    // 1. Filtrar partidas da Fase de Liga (League Stage / Regular Season)
    var leagueStageFixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return r.contains('league') ||
          r.contains('fase de liga') ||
          r.contains('regular') ||
          r.contains('group') ||
          r.contains('matchday') ||
          r.contains('rodada');
    }).toList();

    // Se a API ainda não tiver partidas publicadas para 2026/27, usa a grade oficial de 144 jogos do sorteio
    if (leagueStageFixtures.isEmpty) {
      leagueStageFixtures = ChampionsLeague2026Data.getScheduledFixtures();
    }

    // 2. Classificação Geral da Fase de Liga (36 Equipes)
    List<Standing> leagueStandings = [];
    if (rawStandings.isNotEmpty) {
      leagueStandings = StandingsEngine.sortStandings(rawStandings);
    } else {
      // Calcular a partir das partidas finalizadas ou iniciar tabela zerada oficial
      final finishedFixtures = leagueStageFixtures.where((f) => f.statusShort == 'FT' || f.statusShort == 'AET' || f.statusShort == 'PEN').toList();
      if (finishedFixtures.isNotEmpty) {
        leagueStandings = StandingsEngine.calculateStandingsFromFixtures(
          finishedFixtures,
          group: 'Fase de Liga',
        );
      } else {
        leagueStandings = ChampionsLeague2026Data.getInitialStandings();
      }
    }

    // 3. Fase 1: Fase de Liga (Tabela Única de 36 clubes)
    phases.add(CompetitionPhase(
      id: 'champions_league_stage',
      name: 'Fase de Liga (36 Clubes)',
      type: PhaseType.league,
      standings: leagueStandings,
      fixtures: leagueStageFixtures,
    ));

    // 4. Filtrar partidas de Mata-Mata
    final playoffFixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return r.contains('play-off') || r.contains('playoff') || r.contains('knockout round play-offs');
    }).toList();

    final r16Fixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return r.contains('round of 16') || r.contains('oitavas') || r.contains('1/8');
    }).toList();

    final qfFixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return r.contains('quarter') || r.contains('quartas') || r.contains('1/4');
    }).toList();

    final sfFixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return r.contains('semi') || r.contains('1/2');
    }).toList();

    final finalFixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('play-off') && !r.contains('1/8'));
    }).toList();

    // 5. Chaveamento Mata-Mata Consolidado
    final List<Tie> allKnockoutTies = [];

    if (rawFixtures.isNotEmpty && (playoffFixtures.isNotEmpty || r16Fixtures.isNotEmpty)) {
      final playoffTies = BracketEngine.generateChampionsPlayoffs(leagueStandings, playoffFixtures);
      final r16Ties = BracketEngine.generateChampionsRoundOf16(leagueStandings, r16Fixtures);
      final qfTies = BracketEngine.generateChampionsQuarterFinals(qfFixtures);
      final sfTies = BracketEngine.generateChampionsSemiFinals(sfFixtures);
      final finalTies = BracketEngine.generateChampionsFinal(finalFixtures);

      allKnockoutTies.addAll(playoffTies);
      allKnockoutTies.addAll(r16Ties);
      allKnockoutTies.addAll(qfTies);
      allKnockoutTies.addAll(sfTies);
      allKnockoutTies.addAll(finalTies);
    } else {
      // Estrutura prévia do mata-mata 2026/27 oficial
      allKnockoutTies.addAll(ChampionsLeague2026Data.getKnockoutTies());
    }

    final allKnockoutFixtures = [
      ...playoffFixtures,
      ...r16Fixtures,
      ...qfFixtures,
      ...sfFixtures,
      ...finalFixtures,
    ];

    phases.add(CompetitionPhase(
      id: 'champions_knockout',
      name: 'Mata-Mata / Chaveamento',
      type: PhaseType.knockout,
      ties: allKnockoutTies,
      fixtures: allKnockoutFixtures,
    ));

    // 6. Fases de Qualificação Preliminar (se houver partidas na temporada)
    final qualFixtures = rawFixtures.where((f) {
      final r = f.round?.toLowerCase() ?? '';
      return r.contains('qualifying') || r.contains('preliminary') || r.contains('qualificação') || r.contains('eliminatória');
    }).toList();

    if (qualFixtures.isNotEmpty) {
      phases.add(CompetitionPhase(
        id: 'champions_qualifying',
        name: 'Fase de Qualificação',
        type: PhaseType.knockout,
        ties: BracketEngine.buildTiesFromFixtures('champions_qualifying', qualFixtures, isTwoLegged: true),
        fixtures: qualFixtures,
      ));
    }

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName.isNotEmpty ? leagueName : 'UEFA Champions League',
      logo: leagueLogo ?? 'https://media.api-sports.io/football/leagues/2.png',
      country: 'World',
      season: season,
      phases: phases,
    );
  }
}
