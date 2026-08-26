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
    if (leagueId == 622) {
      return _buildGauchoSerieA(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    } else if (leagueId == 853) {
      return _buildGauchoDivisaoAcesso(
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

  // --- SÉRIE A: CAMPEONATO GAÚCHO 2026 ---
  // 1ª Fase (12 clubes em 2 grupos de 6, 6 rodadas) -> Quartas (Jogo Único) -> Semi (Ida e Volta) -> Final (Ida e Volta)
  static Competition _buildGauchoSerieA({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Classificatória (2 Grupos de 6 clubes, 6 rodadas enfrentando o outro grupo)
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

    final groupsMap = StandingsEngine.splitGauchoSerieAGroups(
      rawStandings,
      fixtures: firstPhaseFixtures,
    );

    final groupAStandings = groupsMap['Grupo A'] ?? [];
    final groupBStandings = groupsMap['Grupo B'] ?? [];

    final gATeamIds = groupAStandings.map((s) => s.teamId).toSet();
    final gBTeamIds = groupBStandings.map((s) => s.teamId).toSet();

    final gAFixtures = firstPhaseFixtures.where((f) {
      final hId = f.homeTeam?.externalId ?? (int.tryParse(f.homeTeam?.id ?? '') ?? 0);
      final aId = f.awayTeam?.externalId ?? (int.tryParse(f.awayTeam?.id ?? '') ?? 0);
      return gATeamIds.contains(hId) || gATeamIds.contains(aId);
    }).toList();

    final gBFixtures = firstPhaseFixtures.where((f) {
      final hId = f.homeTeam?.externalId ?? (int.tryParse(f.homeTeam?.id ?? '') ?? 0);
      final aId = f.awayTeam?.externalId ?? (int.tryParse(f.awayTeam?.id ?? '') ?? 0);
      return gBTeamIds.contains(hId) || gBTeamIds.contains(aId);
    }).toList();

    final firstPhaseRounds = _extractRounds(firstPhaseFixtures, 6);

    final primeiraFasePhase = CompetitionPhase(
      id: 'primeira_fase_a1',
      name: '1ª Fase (Grupos)',
      type: PhaseType.groupStage,
      groups: [
        PhaseGroup(
          id: 'grupo_a',
          name: 'Grupo A',
          standings: groupAStandings,
          fixtures: gAFixtures,
        ),
        PhaseGroup(
          id: 'grupo_b',
          name: 'Grupo B',
          standings: groupBStandings,
          fixtures: gBFixtures,
        ),
      ],
      rounds: firstPhaseRounds,
      fixtures: firstPhaseFixtures,
      qualificationRuleDescription: '1º ao 4º colocados de cada grupo avançam para as Quartas de Final. 5º e 6º colocados são eliminados.',
      relegationRuleDescription: 'Conforme regulamento da FGF.',
    );

    // 2. Quartas de Final (Jogo Único: 1ºA x 4ºB, 2ºA x 3ºB, 1ºB x 4ºA, 2ºB x 3ºA)
    final qfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('quarter') || r.contains('quartas');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final qfTies = BracketEngine.generateGauchoSerieAQuarterFinals(
      groupAStandings,
      groupBStandings,
      qfFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quarter_finals_a1',
      name: 'Quartas de Final',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: qfFixtures,
      ties: qfTies,
      qualificationRuleDescription: 'Disputadas em jogo único com mando de campo do clube de melhor campanha no grupo (1º e 2º colocados). Em caso de empate, vaga decidida nos pênaltis.',
    );

    // 3. Semifinais (Ida e Volta: Vencedor QF1 × Vencedor QF2 | Vencedor QF3 × Vencedor QF4)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final sfTies = BracketEngine.generateGauchoSerieASemiFinals(
      qfTies,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semi_finals_a1',
      name: 'Semifinais',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (Vencedor QF1 × Vencedor QF2 e Vencedor QF3 × Vencedor QF4). Em caso de empate no agregado, saldo de gols e pênaltis decidem os finalistas.',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' || (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd'));
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateGauchoSerieAFinal(sfTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_a1',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogos de ida e volta entre os vencedores das semifinais. O vencedor é o Campeão Gaúcho 2026.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      division: DivisionLevel.a1,
      rules: const CompetitionRules(
        relegatedTo: 'Divisão de Acesso 2027',
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

  // --- SÉRIE A2 (DIVISÃO DE ACESSO): CAMPEONATO GAÚCHO 2026 ---
  // 1ª Fase (Grupo Único de 16 clubes, 15 rodadas) -> Quartas (Ida e Volta) -> Semi (Ida e Volta - Acesso A1) -> Final (Ida e Volta)
  static Competition _buildGauchoDivisaoAcesso({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. 1ª Fase: Grupo Único (15 rodadas em turno único, todos contra todos)
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
      qualificationRuleDescription: '1º ao 8º colocados avançam para as Quartas de Final. 9º ao 14º permanecem na Série A2. 15º e 16º são rebaixados para a Segunda Divisão de 2027.',
      relegationRuleDescription: 'Os 2 últimos colocados (15º e 16º) caem para a Segunda Divisão de 2027.',
    );

    // 2. Quartas de Final (Ida e Volta: 1ºx8º, 2ºx7º, 3ºx6º, 4ºx5º)
    final qfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('quarter') || r.contains('quartas');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final qfTies = BracketEngine.generateGauchoAcessoQuarterFinals(
      sortedStandings,
      qfFixtures,
    );

    final quartasPhase = CompetitionPhase(
      id: 'quarter_finals_a2',
      name: 'Quartas de Final',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: qfFixtures,
      ties: qfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (1º×8º, 2º×7º, 3º×6º e 4º×5º). Em caso de empate no agregado, pênaltis decidem os semifinalistas.',
    );

    // 3. Semifinais (Ida e Volta: Vencedor QF1 × Vencedor QF4 | Vencedor QF2 × Vencedor QF3 — VALEM O ACESSO À SÉRIE A 2027 ⬆️)
    final sfFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('semi') && !r.contains('quarter');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final sfTies = BracketEngine.generateGauchoAcessoSemiFinals(
      qfTies,
      sfFixtures,
    );

    final semiPhase = CompetitionPhase(
      id: 'semi_finals_a2',
      name: 'Semifinais (Acesso Série A)',
      type: PhaseType.knockout,
      legs: 2,
      fixtures: sfFixtures,
      ties: sfTies,
      qualificationRuleDescription: 'Disputadas em jogos de ida e volta (Vencedor QF1 × Vencedor QF4 e Vencedor QF2 × Vencedor QF3). Os 2 finalistas garantem o ACESSO À SÉRIE A DE 2027!',
    );

    // 4. Grande Final (Ida e Volta)
    final finalFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r == 'final' || (r.contains('final') && !r.contains('semi') && !r.contains('quarter') && !r.contains('3rd'));
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final finalTies = BracketEngine.generateGauchoAcessoFinal(sfTies, finalFixtures);

    final finalPhase = CompetitionPhase(
      id: 'final_a2',
      name: 'Final',
      type: PhaseType.finalStage,
      legs: 2,
      fixtures: finalFixtures,
      ties: finalTies,
      qualificationRuleDescription: 'Disputada em jogos de ida e volta entre os dois finalistas promovidos. O vencedor é o Campeão Gaúcho da Série A2 de 2026.',
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
        promotedTo: 'Série A 2027',
        relegationCount: 2,
        relegatedTo: 'Segunda Divisão (Série B) 2027',
      ),
      phases: [
        primeiraFasePhase,
        quartasPhase,
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
