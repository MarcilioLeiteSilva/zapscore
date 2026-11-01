import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
import 'standings_engine.dart';
import 'bracket_engine.dart';
import '../data/baiano_2027_schedule.dart';

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
    if (leagueId == 602) {
      return _buildBaianoA1(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 613) {
      return _buildBaianoB(
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

  // =======================================================
  // --- 🏆 SÉRIE A: CAMPEONATO BAIANO (ID 602) ---
  // =======================================================
  // 1ª Fase (10 clubes, turno único, 9 rodadas) -> Semifinais (Jogo Único) -> Final (Jogo Único)
  static Competition _buildBaianoA1({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // Se for 2027 e dados remotos estiverem vazios/incompletos, usa tabela oficial da FBF
    final bool is2027 = season >= 2027;

    List<Fixture> firstPhaseFixtures = rawFixtures.where((f) {
      if (is2027 && f.season != 2027) return false;
      final r = (f.round ?? '').toLowerCase();
      final isKnockout = r.contains('semi') || r.contains('final') || r.contains('decisão');
      return !isKnockout;
    }).toList();

    if (is2027 && firstPhaseFixtures.length < 10) {
      firstPhaseFixtures = Baiano2027Schedule.getOfficialFirstPhaseFixtures();
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
        sortedStandings = Baiano2027Schedule.getOfficialInitialStandings();
      }
    }

    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 9);

    final primeiraFasePhase = CompetitionPhase(
      id: is2027 ? 'primeira_fase_2027' : 'primeira_fase_a1',
      name: '1ª Fase (Classificação)',
      type: PhaseType.league,
      legs: 1,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: is2027
          ? '1º ao 4º colocados avançam para as Semifinais. 9º e 10º colocados são rebaixados para a Série B de 2028.'
          : '1º ao 4º colocados avançam para as Semifinais. 9º e 10º colocados são rebaixados para a Série B de 2027.',
      relegationRuleDescription: is2027
          ? '9º e 10º colocados são rebaixados para a Série B de 2028.'
          : '9º e 10º colocados são rebaixados para a Série B de 2027.',
    );

    // 2. Semifinais (Jogo Único: 1º × 4º e 2º × 3º)
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('regular') && !r.contains('1st phase');
    }).toList();

    final semiTies = BracketEngine.generateBaianoA1SemiFinals(semiFixtures, sortedStandings);

    final semifinaisPhase = CompetitionPhase(
      id: 'semifinais_a1',
      name: 'Semifinais (Jogo Único)',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Jogos únicos com mando da equipe de melhor campanha. Empate leva para os pênaltis. Vencedores avançam para a Final.',
    );

    // 3. Grande Final (Jogo Único: Vencedor SF1 × Vencedor SF2)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) && !r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList();

    final finalTies = BracketEngine.generateBaianoA1Final(finalFixtures, sortedStandings);

    final finalPhase = CompetitionPhase(
      id: 'final_a1',
      name: 'Grande Final (Jogo Único)',
      type: PhaseType.finalStage,
      legs: 1,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Jogo único com mando da equipe de melhor campanha geral. Empate leva para os pênaltis. Vencedor é o Campeão Baiano 2026.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      phases: [
        primeiraFasePhase,
        semifinaisPhase,
        finalPhase,
      ],
    );
  }

  // =======================================================
  // --- 🥈 SÉRIE B: CAMPEONATO BAIANO 2026 (ID 613) ---
  // =======================================================
  // 1ª Fase (10 clubes, 9 rodadas) -> Semifinais (Ida e Volta) -> Final (Ida e Volta)
  static Competition _buildBaianoB({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Classificação (9 Rodadas)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('regular season') ||
          r.contains('1st phase') ||
          r.contains('primeira fase') ||
          r.contains('classificatória') ||
          r.contains('fase de grupos');
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 9);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_b',
      name: '1ª Fase (Classificação)',
      type: PhaseType.league,
      legs: 1,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '1º ao 4º colocados avançam para as Semifinais.',
    );

    // 2. Semifinais (Ida e Volta: 1º × 4º e 2º × 3º)
    final semiFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('regular') && !r.contains('1st phase');
    }).toList();

    final semiTies = BracketEngine.generateBaianoBSemiFinals(semiFixtures, sortedStandings);

    final semifinaisPhase = CompetitionPhase(
      id: 'semifinais_b',
      name: 'Semifinais (Ida e Volta)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: semiFixtures,
      ties: semiTies,
      qualificationRuleDescription: 'Confrontos de ida e volta (1º × 4º e 2º × 3º). Os dois finalistas garantem acesso à Série A de 2027.',
    );

    // 3. Grande Final (Ida e Volta: Vencedor SF1 × Vencedor SF2)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('final') || r.contains('decisão')) && !r.contains('semi') && !r.contains('quarter') && !r.contains('regular');
    }).toList();

    final finalTies = BracketEngine.generateBaianoBFinal(finalFixtures, sortedStandings);

    final finalPhase = CompetitionPhase(
      id: 'final_b',
      name: 'Grande Final (Ida e Volta)',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputa do título em jogos de ida e volta. Vencedor é o Campeão da Série B.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      phases: [
        primeiraFasePhase,
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
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final rounds = _extractRounds(rawFixtures, 38);

    final mainPhase = CompetitionPhase(
      id: 'fase_unica',
      name: 'Classificação',
      type: PhaseType.league,
      legs: 1,
      rounds: rounds,
      fixtures: rawFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: 'Tabela de classificação oficial.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      phases: [mainPhase],
    );
  }

  // --- MÉTODOS AUXILIARES ---
  static List<PhaseRound> _extractRounds(List<Fixture> fixtures, int maxRounds) {
    final Map<int, List<Fixture>> roundMap = {};

    for (final f in fixtures) {
      final roundNum = _extractRoundNumber(f.round);
      if (roundNum > 0) {
        roundMap.putIfAbsent(roundNum, () => []).add(f);
      }
    }

    final List<PhaseRound> result = [];
    final sortedKeys = roundMap.keys.toList()..sort();

    for (final rNum in sortedKeys) {
      result.add(PhaseRound(
        id: 'round_$rNum',
        number: rNum,
        name: '$rNumª Rodada',
        fixtures: roundMap[rNum]!,
      ));
    }

    return result;
  }

  static int _extractRoundNumber(String? roundStr) {
    if (roundStr == null) return 0;
    final match = RegExp(r'(\d+)').firstMatch(roundStr);
    if (match != null) {
      return int.tryParse(match.group(1) ?? '0') ?? 0;
    }
    return 0;
  }
}
