import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
import '../models/tie.dart';
import 'standings_engine.dart';
import 'bracket_engine.dart';

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
    if (leagueId == 475) {
      return _buildPaulistaA1(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 476) {
      return _buildPaulistaA2(
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

  // --- SÉRIE A1: CAMPEONATO PAULISTA 2026 ---
  // 1ª Fase (Grupo Único 16 clubes, 15 jogos) -> Quartas (Jogo Único) -> Semi (Jogo Único) -> Final (Ida e Volta)
  static Competition _buildPaulistaA1({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Grupo Único (15 rodadas em turno único)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('regular season') || r.contains('1st phase') || r.contains('fase de grupos') || r.contains('primeira fase');
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 15);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_a1',
      name: '1ª Fase',
      type: PhaseType.league,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '1º ao 8º colocados avançam para as Quartas de Final. 9º ao 14º permanecem na Série A1. 15º e 16º são rebaixados para a Série A2.',
      relegationRuleDescription: 'Os 2 últimos colocados (15º e 16º) caem para a Série A2 de 2027.',
    );

    // 2. Quartas de Final (Jogo Único: 1ºx8º, 2ºx7º, 3ºx6º, 4ºx5º)
    final qfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('quarter') || r.contains('quartas');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final qfTies = BracketEngine.generatePaulistaA1QuarterFinals(
      sortedStandings,
      qfFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quarter_finals_a1',
      name: 'Quartas de Final',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: qfFixtures,
      ties: qfTies,
      qualificationRuleDescription: 'Disputadas em jogo único com mando de campo do clube de melhor campanha. Em caso de empate, vaga decidida nos pênaltis.',
    );

    // 3. Semifinais (Jogo Único: 1ª melhor campanha vs 4ª e 2ª vs 3ª)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final sfTies = BracketEngine.generatePaulistaA1SemiFinals(
      qfTies,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semi_finals_a1',
      name: 'Semifinais',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogo único com mando do clube de melhor campanha acumulada. Em caso de empate, vaga decidida nos pênaltis.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' || (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd'));
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generatePaulistaA1Final(sfTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_a1',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogos de ida e volta. Em caso de empate no agregado, saldo de gols e pênaltis decidem o Campeão Paulista 2026.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a1,
      rules: const CompetitionRules(
        relegatedTo: 'Série A2 2027',
        relegationCount: 2,
      ),
      phases: [
        primeiraFasePhase,
        quartasPhase,
        semiPhase,
        finalPhase,
      ],
    );
  }

  // --- SÉRIE A2: CAMPEONATO PAULISTA 2026 ---
  // 1ª Fase (Grupo Único 16 clubes, 15 jogos) -> Quadrangular (Grupos 2 e 3 em 6 rodadas) -> Semi (Ida e Volta - Acesso A1) -> Final (Ida e Volta)
  static Competition _buildPaulistaA2({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Grupo Único (15 rodadas em turno único)
    final firstPhaseFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('1st phase') || r.contains('primeira fase') || (r.contains('regular') && !r.contains('2nd phase'));
    }).toList();

    firstPhaseFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    final sortedStandings = StandingsEngine.sortStandings(rawStandings);
    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 15);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_a2',
      name: '1ª Fase',
      type: PhaseType.league,
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: '1º ao 8º colocados avançam para o Quadrangular (2ª Fase). 9º ao 14º permanecem na Série A2. 15º e 16º são rebaixados para a Série A3.',
      relegationRuleDescription: 'Os 2 últimos colocados (15º e 16º) caem para a Série A3 de 2027.',
    );

    // 2. 2ª Fase: Quadrangular (Grupo 2: 1º, 3º, 6º, 8º | Grupo 3: 2º, 4º, 5º, 7º)
    final quadrangularFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('2nd phase') || r.contains('quadrangular') || r.contains('segunda fase') || r.contains('group 2') || r.contains('group 3');
    }).toList();

    final groupsMap = StandingsEngine.splitPaulistaA2Quadrangular(
      sortedStandings,
      quadrangularFixtures: quadrangularFixtures,
    );

    final group2Standings = groupsMap['Grupo 2'] ?? [];
    final group3Standings = groupsMap['Grupo 3'] ?? [];

    final g2TeamIds = group2Standings.map((s) => s.teamId).toSet();
    final g3TeamIds = group3Standings.map((s) => s.teamId).toSet();

    final g2Fixtures = quadrangularFixtures.where((f) {
      final hId = f.homeTeam?.externalId ?? (int.tryParse(f.homeTeam?.id ?? '') ?? 0);
      final aId = f.awayTeam?.externalId ?? (int.tryParse(f.awayTeam?.id ?? '') ?? 0);
      return g2TeamIds.contains(hId) || g2TeamIds.contains(aId);
    }).toList();

    final g3Fixtures = quadrangularFixtures.where((f) {
      final hId = f.homeTeam?.externalId ?? (int.tryParse(f.homeTeam?.id ?? '') ?? 0);
      final aId = f.awayTeam?.externalId ?? (int.tryParse(f.awayTeam?.id ?? '') ?? 0);
      return g3TeamIds.contains(hId) || g3TeamIds.contains(aId);
    }).toList();

    final quadRounds = _extractRounds(quadrangularFixtures, 6);

    final quadrangularPhase = CompetitionPhase(
      id: 'quadrangular_a2',
      name: 'Quadrangular',
      type: PhaseType.groupStage,
      legs: 2,
      groups: [
        PhaseGroup(
          id: 'grupo_2',
          name: 'Grupo 2',
          standings: group2Standings,
          fixtures: g2Fixtures,
        ),
        PhaseGroup(
          id: 'grupo_3',
          name: 'Grupo 3',
          standings: group3Standings,
          fixtures: g3Fixtures,
        ),
      ],
      rounds: quadRounds,
      fixtures: quadrangularFixtures,
      qualificationRuleDescription: 'Disputado em turno e returno (6 rodadas). Grupo 2 (1º, 3º, 6º e 8º da 1ª fase) e Grupo 3 (2º, 4º, 5º e 7º da 1ª fase). Os 2 melhores de cada grupo avançam para as Semifinais.',
    );

    // 3. Semifinais (Ida e Volta: 1ºG2 × 2ºG3 e 1ºG3 × 2ºG2 — VALEM O ACESSO À SÉRIE A1 2027 ⬆️)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final sfTies = BracketEngine.generatePaulistaA2SemiFinals(
      group2Standings,
      group3Standings,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semi_finals_a2',
      name: 'Semifinais (Acesso A1)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (1ºG2 × 2ºG3 e 1ºG3 × 2ºG2). Os 2 vencedores garantem o ACESSO À SÉRIE A1 DE 2027 e disputam o título na Final.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' || (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd'));
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generatePaulistaA2Final(sfTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_a2',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogos de ida e volta entre os dois finalistas promovidos. O vencedor é o Campeão Paulista da Série A2 de 2026.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a2,
      rules: const CompetitionRules(
        promotionCount: 2,
        promotedTo: 'Série A1 2027',
        relegationCount: 2,
        relegatedTo: 'Série A3 2027',
      ),
      phases: [
        primeiraFasePhase,
        quadrangularPhase,
        semiPhase,
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
