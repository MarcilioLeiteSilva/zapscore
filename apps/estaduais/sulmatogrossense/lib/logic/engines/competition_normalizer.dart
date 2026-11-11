import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
import 'standings_engine.dart';
import 'bracket_engine.dart';
import '../data/sulmatogrossense_2027_schedule.dart';

class CompetitionNormalizer {
  /// Normaliza dados brutos de API em uma estrutura completa e tipada de Competition
  static Competition normalize({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    if (leagueId == 623) {
      return _buildSulmatogrossense(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    }

    // Genérico para outros campeonatos
    return _buildGenericCompetition(
      leagueId: leagueId,
      leagueName: leagueName,
      leagueLogo: leagueLogo,
      season: season,
      rawStandings: rawStandings,
      rawFixtures: rawFixtures,
    );
  }

  // =========================================================================
  // --- 🏆 CAMPEONATO SUL-MATO-GROSSENSE SÉRIE A (ID 623) ---
  // =========================================================================
  // 1ª Fase (10 clubes em turno único - 9 rodadas / 45 jogos)
  // 1º e 2º colocados avançam direto para as Semifinais
  // 3º ao 6º colocados disputam as Quartas de Final (Ida e Volta: 3º x 6º, 4º x 5º)
  // Semifinais (Ida e Volta: 1º x Venc. QF, 2º x Venc. QF)
  // Grande Final (Ida e Volta)
  // Rebaixamento (Z2): 9º e 10º colocados são rebaixados para a Série B 2028
  static Competition _buildSulmatogrossense({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    final bool is2027 = season >= 2027;

    List<Fixture> firstPhaseFixtures = rawFixtures.where((f) {
      if (is2027 && f.season != 2027 && f.season != 0) return false;
      final r = (f.round ?? '').toLowerCase();
      final isKnockout = r.contains('semi') || r.contains('final') || r.contains('quarter') || r.contains('quartas');
      return !isKnockout;
    }).toList();

    if (is2027 && firstPhaseFixtures.length < 10) {
      firstPhaseFixtures = Sulmatogrossense2027Schedule.getOfficialFirstPhaseFixtures();
    }

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    List<Standing> sortedStandings = StandingsEngine.sortStandings(rawStandings);
    if (is2027 && (sortedStandings.isEmpty || sortedStandings.every((s) => s.played == 0))) {
      final calculated = StandingsEngine.calculateStandingsFromFixtures(firstPhaseFixtures);
      if (calculated.isNotEmpty && calculated.any((s) => s.played > 0)) {
        sortedStandings = calculated;
      } else {
        sortedStandings = Sulmatogrossense2027Schedule.getOfficialInitialStandings();
      }
    }

    // Anotar descrições de classificação/rebaixamento na tabela
    final annotatedStandings = <Standing>[];
    for (int i = 0; i < sortedStandings.length; i++) {
      final s = sortedStandings[i];
      final rank = i + 1;
      String? desc;
      if (rank <= 2) {
        desc = 'Classificado direto para as Semifinais';
      } else if (rank <= 6) {
        desc = 'Classificado para as Quartas de Final';
      } else if (rank >= 9) {
        desc = is2027 ? 'Rebaixamento para a Série B 2028' : 'Rebaixamento para a Série B 2027';
      }
      annotatedStandings.add(Standing(
        rank: rank,
        teamId: s.teamId,
        teamName: s.teamName,
        teamLogo: s.teamLogo,
        points: s.points,
        played: s.played,
        win: s.win,
        draw: s.draw,
        lose: s.lose,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalsDiff: s.goalsDiff,
        group: s.group,
        form: s.form,
        description: desc,
      ));
    }

    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 9);

    final primeiraFasePhase = CompetitionPhase(
      id: is2027 ? 'primeira_fase_2027' : 'primeira_fase_623',
      name: '1ª Fase (Turno Único)',
      type: PhaseType.league,
      legs: 1,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: annotatedStandings,
      qualificationRuleDescription: is2027
          ? 'Os 2 primeiros colocados avançam direto para as Semifinais. Os times de 3º ao 6º lugar disputam as Quartas de Final em ida e volta. Os 2 últimos (9º e 10º) são rebaixados para a Série B de 2028.'
          : 'Os 2 primeiros avançam para as Semifinais. 3º ao 6º disputam as Quartas. 9º e 10º são rebaixados.',
      relegationRuleDescription: is2027
          ? '9º e 10º colocados são rebaixados para a Série B 2028.'
          : '9º e 10º colocados são rebaixados para a Série B 2027.',
    );

    // 2. Quartas de Final (Ida e Volta: 3º × 6º e 4º × 5º)
    final quarterFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas')) && !r.contains('regular');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final quarterTies = BracketEngine.buildTiesFromFixtures(
      'quarter_finals_623',
      quarterFixtures,
      isTwoLegged: true,
      defaultSeedPairs: const ['3º Colocado x 6º Colocado', '4º Colocado x 5º Colocado'],
    );

    final quartasPhase = CompetitionPhase(
      id: 'quartas_623',
      name: 'Quartas de Final (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: quarterFixtures,
      ties: quarterTies,
      qualificationRuleDescription: 'Confrontos em jogos de ida e volta (3º × 6º e 4º × 5º). Os vencedores avançam para as Semifinais.',
    );

    // 3. Semifinais (Ida e Volta: 1º × Venc. QF e 2º × Venc. QF)
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('regular') && !r.contains('quarter') && !r.contains('quartas');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final semiTies = BracketEngine.buildTiesFromFixtures(
      'semi_finals_623',
      semiFixtures,
      isTwoLegged: true,
      defaultSeedPairs: const ['1º Colocado x Vencedor QF', '2º Colocado x Vencedor QF'],
    );

    final semifinaisPhase = CompetitionPhase(
      id: 'semi_finals_623',
      name: 'Semifinais (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Confrontos de ida e volta entre os dois líderes da 1ª Fase e os dois classificados das quartas. Vencedores avançam para a Grande Final.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) &&
          !r.contains('semi') &&
          !r.contains('quarter') &&
          !r.contains('quartas');
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.buildTiesFromFixtures(
      'final_623',
      finalFixtures,
      isTwoLegged: true,
      defaultSeedPairs: const ['Finalista 1 x Finalista 2'],
    );

    final finalPhase = CompetitionPhase(
      id: 'final_623',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: is2027
          ? 'Decisão do título em jogos de ida e volta. O clube de melhor campanha geral decide em casa. O vencedor é o Campeão Sul-Mato-Grossense 2027.'
          : 'Decisão do título em jogos de ida e volta.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brasil',
      division: DivisionLevel.a1,
      phases: [
        primeiraFasePhase,
        quartasPhase,
        semifinaisPhase,
        finalPhase,
      ],
    );
  }

  // --- GENÉRICO (Fallback) ---
  static Competition _buildGenericCompetition({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    final rounds = _extractRounds(rawFixtures, 38);
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);

    final mainPhase = CompetitionPhase(
      id: 'phase_main',
      name: 'Fase Principal',
      type: PhaseType.league,
      rounds: rounds,
      fixtures: rawFixtures,
      standings: sortedStandings,
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      phases: [mainPhase],
    );
  }

  static int _extractRoundNumber(String? r) {
    if (r == null) return 999;
    final match = RegExp(r'\d+').firstMatch(r);
    return match != null ? (int.tryParse(match.group(0)!) ?? 999) : 999;
  }

  static List<PhaseRound> _extractRounds(
    List<Fixture> fixtures,
    int maxRounds, {
    String prefix = 'Rodada ',
  }) {
    final Map<int, List<Fixture>> roundsMap = {};

    for (final fix in fixtures) {
      final roundNum = _extractRoundNumber(fix.round);
      final validNum = roundNum != 999 ? roundNum : 1;
      roundsMap.putIfAbsent(validNum, () => []).add(fix);
    }

    for (final list in roundsMap.values) {
      list.sort((a, b) => a.date.compareTo(b.date));
    }

    final sortedKeys = roundsMap.keys.toList()..sort();
    return sortedKeys.map((num) {
      return PhaseRound(
        id: 'round_$num',
        number: num,
        name: '$prefix$num',
        fixtures: roundsMap[num] ?? [],
      );
    }).toList();
  }
}
