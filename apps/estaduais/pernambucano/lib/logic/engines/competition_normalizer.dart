import '../models/competition.dart';
import '../models/competition_phase.dart';
import '../models/fixture.dart';
import '../models/standing.dart';
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
    // --- 🏆 PERNAMBUCANO (ID 622 Unificado FPF 2026/2027) ---
    if (leagueId == 622) {
      return _buildPernambucanoUnified(
        leagueId: leagueId,
        leagueName: leagueName,
        leagueLogo: leagueLogo,
        season: season,
        rawStandings: rawStandings,
        rawFixtures: rawFixtures,
      );
    }

    // --- 🥈 SÉRIE A2 (ID 1125) ---
    if (leagueId == 1125) {
      return _buildPernambucanoA2(
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
  // --- 🏆 SÉRIE A1: CAMPEONATO PERNAMBUCANO 2026 (ID 622) ---
  // =========================================================================
  // 1ª Fase (10 clubes em turno único, 9 rodadas)
  // Quartas de Final (3º × 6º e 4º × 5º em Jogo Único)
  // Semifinais (1º × Venc. QF e 2º × Venc. QF em Ida e Volta)
  // Grande Final (Ida e Volta)
  // =========================================================================
  // --- 🏆 CAMPEONATO PERNAMBUCANO 2026/2027 (UNIFICADO FPF - 31 CLUBES) ---
  // =========================================================================
  // 1º Turno (Turno Forró - 24 Clubes):
  // - 4 Grupos regionalizados de 6 clubes (Sertão, Agreste, Zona da Mata, Metropolitana)
  // - Turno único (5 jogos por clube)
  // - 4 melhores de cada grupo avançam para as Oitavas de Final (16 clubes)
  // - Oitavas de final (Jogo Único)
  // - Quartas de final (Jogo Único)
  // - Quadrangular Final (4 clubes · Turno único · 1º campeão do turno · 1º, 2º e 3º avançam ao Turno Frevo)
  //
  // 2º Turno (Turno Frevo - 10 Clubes):
  // - 7 já classificados da Série A1 2026: Sport, Náutico, Santa Cruz, Retrô, Maguary, Decisão, Vitória
  // - 3 classificados do Quadrangular Final do Turno Forró
  // - Disputa pelo título de Campeão Pernambucano 2027
  static Competition _buildPernambucanoUnified({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    // 1. Filtrar jogos da Fase de Grupos do Turno Forró
    final forroFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      final isKnockout = r.contains('semi') ||
          r.contains('final') ||
          r.contains('quarter') ||
          r.contains('quartas') ||
          r.contains('oitavas') ||
          r.contains('round of 16') ||
          r.contains('playoff') ||
          r.contains('quadrangular');
      return !isKnockout;
    }).toList();

    forroFixtures.sort((a, b) {
      final numA = _extractRoundNumber(a.round);
      final numB = _extractRoundNumber(b.round);
      if (numA != numB) return numA.compareTo(numB);
      return a.date.compareTo(b.date);
    });

    // Grupos canônicos FPF
    bool inGroup(String? name, Set<String> groupSet) {
      if (name == null) return false;
      final norm = name.toLowerCase().trim();
      return groupSet.any((t) => norm.contains(t) || t.contains(norm));
    }

    const groupASertao = {
      '1º de maio', '1 de maio', 'afogados', 'facilnet', 'ferroviario do cabo', 'ferroviário do cabo', 'petrolina', 'salgueiro'
    };
    const groupBAgreste = {
      'belo jardim', 'central', 'central sc', 'cha grande', 'chã grande', 'pesqueira', 'porto', 'ypiranga', 'ypiranga pe'
    };
    const groupCZonaDaMata = {
      'aguia fc', 'águia fc', 'aguia de cumaru', 'águia de cumaru', 'atletico pe', 'atlético pe', 'atletico-pe', 'atlético-pe',
      'centro limoeirense', 'jaguar', 'jaguare', 'jaguaré', 'santa fe pe', 'santa fé pe', 'santa fe', 'santa fé', 'serrano', 'serrano pe'
    };
    const groupDMetropolitana = {
      'america', 'américa', 'america pe', 'américa pe', 'guarany', 'guarany de sobral', 'ibis', 'íbis', 'ipojuca',
      'sete de setembro', 'vera cruz'
    };

    final fixA = forroFixtures.where((f) => inGroup(f.homeTeam?.name, groupASertao) || inGroup(f.awayTeam?.name, groupASertao)).toList();
    final fixB = forroFixtures.where((f) => inGroup(f.homeTeam?.name, groupBAgreste) || inGroup(f.awayTeam?.name, groupBAgreste)).toList();
    final fixC = forroFixtures.where((f) => inGroup(f.homeTeam?.name, groupCZonaDaMata) || inGroup(f.awayTeam?.name, groupCZonaDaMata)).toList();
    final fixD = forroFixtures.where((f) => inGroup(f.homeTeam?.name, groupDMetropolitana) || inGroup(f.awayTeam?.name, groupDMetropolitana)).toList();

    // Standings de cada grupo calculadas via StandingsEngine com todos os clubes
    final stdA = StandingsEngine.calculateStandingsFromFixtures(fixA, group: 'Grupo A (Sertão)');
    final stdB = StandingsEngine.calculateStandingsFromFixtures(fixB, group: 'Grupo B (Agreste)');
    final stdC = StandingsEngine.calculateStandingsFromFixtures(fixC, group: 'Grupo C (Zona da Mata)');
    final stdD = StandingsEngine.calculateStandingsFromFixtures(fixD, group: 'Grupo D (Metropolitana)');

    final groups = [
      PhaseGroup(id: 'grupo_a_sertao', name: 'Grupo A (Sertão)', standings: stdA, fixtures: fixA),
      PhaseGroup(id: 'grupo_b_agreste', name: 'Grupo B (Agreste)', standings: stdB, fixtures: fixB),
      PhaseGroup(id: 'grupo_c_mata', name: 'Grupo C (Zona da Mata)', standings: stdC, fixtures: fixC),
      PhaseGroup(id: 'grupo_d_metropolitana', name: 'Grupo D (Metropolitana)', standings: stdD, fixtures: fixD),
    ];

    final forroRounds = _extractRounds(forroFixtures, 5);

    // 1. Fase de Grupos (Turno Forró)
    final faseGruposForro = CompetitionPhase(
      id: 'fase_grupos_forro',
      name: 'Fase de Grupos',
      type: PhaseType.groupStage,
      legs: 1,
      groups: groups,
      rounds: forroRounds,
      fixtures: forroFixtures,
      standings: StandingsEngine.sortStandings([...stdA, ...stdB, ...stdC, ...stdD]),
      qualificationRuleDescription:
          'Os 4 melhores colocados de cada grupo (16 clubes no total) avançam para as Oitavas de Final do Turno Forró.',
    );

    // 2. Oitavas de Final (Jogo Único)
    final oitavasFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('oitavas') || r.contains('round of 16') || r.contains('1/8')) && !r.contains('regular');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final oitavasTies = BracketEngine.generatePernambucanoOitavas(
      rawOitavasFixtures: oitavasFixtures,
      standingsA: stdA,
      standingsB: stdB,
      standingsC: stdC,
      standingsD: stdD,
    );

    final oitavasPhase = CompetitionPhase(
      id: 'oitavas_forro',
      name: 'Oitavas de Final',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: oitavasFixtures,
      ties: oitavasTies,
      qualificationRuleDescription:
          '16 clubes em 8 confrontos de jogo único com mando da equipe de melhor campanha (1ºA × 4ºB, 2ºA × 3ºB, 1ºB × 4ºA, 2ºB × 3ºA, 1ºC × 4ºD, 2ºC × 3ºD, 1ºD × 4ºC, 2ºD × 3ºC). Os vencedores avançam para as Quartas de Final.',
    );

    // 3. Quartas de Final (Jogo Único)
    final quartasFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quarter') || r.contains('quartas') || r.contains('1/4')) && !r.contains('regular');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final quartasTies = BracketEngine.generatePernambucanoQuartas(quartasFixtures);

    final quartasPhase = CompetitionPhase(
      id: 'quartas_forro',
      name: 'Quartas de Final',
      type: PhaseType.knockout,
      legs: 1,
      fixtures: quartasFixtures,
      ties: quartasTies,
      qualificationRuleDescription:
          '8 clubes em 4 confrontos de jogo único. Mando de campo da equipe de melhor campanha. Os 4 vencedores avançam para o Quadrangular Final.',
    );

    // 4. Quadrangular Final (Turno Forró)
    final quadrangularFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return (r.contains('quadrangular') || r.contains('final four')) && !r.contains('regular');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final quadrangularStandings = StandingsEngine.calculateStandingsFromFixtures(
      quadrangularFixtures,
      group: 'Quadrangular Final',
    );

    final quadrangularPhase = CompetitionPhase(
      id: 'quadrangular_forro',
      name: 'Quadrangular Final',
      type: PhaseType.league,
      legs: 1,
      fixtures: quadrangularFixtures,
      standings: quadrangularStandings.isNotEmpty
          ? quadrangularStandings
          : const [
              Standing(rank: 1, teamId: 0, teamName: 'Vencedor Quartas 1', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Campeão do Turno Forró e vaga no Turno Frevo'),
              Standing(rank: 2, teamId: 0, teamName: 'Vencedor Quartas 2', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Vaga no Turno Frevo (2º Turno)'),
              Standing(rank: 3, teamId: 0, teamName: 'Vencedor Quartas 3', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Vaga no Turno Frevo (2º Turno)'),
              Standing(rank: 4, teamId: 0, teamName: 'Vencedor Quartas 4', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0),
            ],
      qualificationRuleDescription:
          'Disputado pelos 4 semifinalistas em turno único (3 jogos por equipe). O 1º colocado é o Campeão do Turno Forró. O 1º, 2º e 3º colocados garantem vaga no Turno Frevo (2º Turno).',
    );

    // 5. 2º Turno — Turno Frevo (Janeiro/2027)
    final frevoFixtures = rawFixtures.where((f) {
      final r = (f.round ?? '').toLowerCase();
      return r.contains('frevo') || r.contains('2º turno') || r.contains('segundo turno');
    }).toList()..sort((a, b) => a.date.compareTo(b.date));

    final frevoStandings = [
      const Standing(rank: 1, teamId: 198, teamName: 'Sport', teamLogo: 'https://media.api-sports.io/football/teams/198.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 2, teamId: 219, teamName: 'Náutico', teamLogo: 'https://media.api-sports.io/football/teams/219.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 3, teamId: 202, teamName: 'Santa Cruz', teamLogo: 'https://media.api-sports.io/football/teams/202.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 4, teamId: 7856, teamName: 'Retrô', teamLogo: 'https://media.api-sports.io/football/teams/7856.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 5, teamId: 19782, teamName: 'Maguary', teamLogo: 'https://media.api-sports.io/football/teams/19782.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 6, teamId: 7837, teamName: 'Decisão', teamLogo: 'https://media.api-sports.io/football/teams/7837.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 7, teamId: 7838, teamName: 'Vitória', teamLogo: 'https://media.api-sports.io/football/teams/7838.png', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Série A1 2026'),
      const Standing(rank: 8, teamId: 0, teamName: '1º Colocado (Turno Forró)', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Campeão Turno Forró'),
      const Standing(rank: 9, teamId: 0, teamName: '2º Colocado (Turno Forró)', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: 'Vice-campeão Turno Forró'),
      const Standing(rank: 10, teamId: 0, teamName: '3º Colocado (Turno Forró)', points: 0, played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, description: '3º Colocado Turno Forró'),
    ];

    final turnoFrevoPhase = CompetitionPhase(
      id: 'turno_frevo',
      name: 'Turno Frevo (2º Turno)',
      type: PhaseType.league,
      legs: 1,
      fixtures: frevoFixtures,
      standings: frevoStandings,
      qualificationRuleDescription:
          'Etapa decisiva que definirá o Campeão Pernambucano 2027. Reúne 10 clubes: 7 já garantidos da Série A1 e os 3 melhores colocados do Turno Forró.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: 'Campeonato Pernambucano 2026/2027',
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      division: DivisionLevel.a1,
      phases: [
        faseGruposForro,
        oitavasPhase,
        quartasPhase,
        quadrangularPhase,
        turnoFrevoPhase,
      ],
    );
  }

  // =========================================================================
  // --- 🥈 SÉRIE A2: CAMPEONATO PERNAMBUCANO 2026 (ID 1125) ---
  // =========================================================================
  static Competition _buildPernambucanoA2({
    required int leagueId,
    required String leagueName,
    String? leagueLogo,
    required int season,
    required List<Standing> rawStandings,
    required List<Fixture> rawFixtures,
  }) {
    final rounds = _extractRounds(rawFixtures, 18);
    final sortedStandings = StandingsEngine.sortStandings(rawStandings);

    final mainPhase = CompetitionPhase(
      id: 'primeira_fase_a2',
      name: 'Fase Principal (Série A2)',
      type: PhaseType.league,
      rounds: rounds,
      fixtures: rawFixtures,
      standings: sortedStandings,
      qualificationRuleDescription: 'Disputa pelo acesso à Série A1 do Campeonato Pernambucano.',
    );

    return Competition(
      id: leagueId.toString(),
      externalId: leagueId,
      name: leagueName,
      logo: leagueLogo,
      season: season,
      country: 'Brazil',
      division: DivisionLevel.a2,
      phases: [mainPhase],
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
    return sortedKeys.map((rNum) {
      return PhaseRound(
        id: 'round_$rNum',
        number: rNum,
        name: '$prefix$rNum',
        fixtures: roundsMap[rNum] ?? [],
      );
    }).toList();
  }
}
