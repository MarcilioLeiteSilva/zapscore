import '../models/fixture.dart';
import '../models/standing.dart';
import '../models/team.dart';
import '../models/tie.dart';

/// Estrutura Oficial da UEFA Champions League 2026/27
/// 36 Clubes, Sorteio da Fase de Liga com 8 confrontos por equipe e Chaveamento do Mata-Mata
class ChampionsLeague2026Data {
  static const String seasonName = '2026/27';
  static const int seasonYear = 2026;

  // --- 1. Metadados e Logos dos 36 Clubes Participantes ---
  static final List<Map<String, dynamic>> clubsRaw = [
    {'id': 541, 'name': 'Real Madrid', 'code': 'RMA', 'country': 'Espanha', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/541.png'},
    {'id': 50, 'name': 'Manchester City', 'code': 'MCI', 'country': 'Inglaterra', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/50.png'},
    {'id': 157, 'name': 'Bayern München', 'code': 'BAY', 'country': 'Alemanha', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/157.png'},
    {'id': 85, 'name': 'Paris Saint-Germain', 'code': 'PSG', 'country': 'França', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/85.png'},
    {'id': 529, 'name': 'Barcelona', 'code': 'BAR', 'country': 'Espanha', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/529.png'},
    {'id': 40, 'name': 'Liverpool', 'code': 'LIV', 'country': 'Inglaterra', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/40.png'},
    {'id': 505, 'name': 'Internazionale', 'code': 'INT', 'country': 'Itália', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/505.png'},
    {'id': 165, 'name': 'Borussia Dortmund', 'code': 'BVB', 'country': 'Alemanha', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/165.png'},
    {'id': 173, 'name': 'RB Leipzig', 'code': 'RBL', 'country': 'Alemanha', 'pot': 1, 'logo': 'https://media.api-sports.io/football/teams/173.png'},

    {'id': 42, 'name': 'Arsenal', 'code': 'ARS', 'country': 'Inglaterra', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/42.png'},
    {'id': 530, 'name': 'Atlético de Madrid', 'code': 'ATM', 'country': 'Espanha', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/530.png'},
    {'id': 33, 'name': 'Manchester United', 'code': 'MUN', 'country': 'Inglaterra', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/33.png'},
    {'id': 492, 'name': 'Napoli', 'code': 'NAP', 'country': 'Itália', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/492.png'},
    {'id': 497, 'name': 'Roma', 'code': 'ROM', 'country': 'Itália', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/497.png'},
    {'id': 212, 'name': 'Porto', 'code': 'FCP', 'country': 'Portugal', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/212.png'},
    {'id': 533, 'name': 'Villarreal', 'code': 'VIL', 'country': 'Espanha', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/533.png'},
    {'id': 610, 'name': 'Galatasaray', 'code': 'GAL', 'country': 'Turquia', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/610.png'},
    {'id': 569, 'name': 'Club Brugge', 'code': 'BRU', 'country': 'Bélgica', 'pot': 2, 'logo': 'https://media.api-sports.io/football/teams/569.png'},

    {'id': 496, 'name': 'Juventus', 'code': 'JUV', 'country': 'Itália', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/496.png'},
    {'id': 228, 'name': 'Sporting CP', 'code': 'SCP', 'country': 'Portugal', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/228.png'},
    {'id': 197, 'name': 'PSV Eindhoven', 'code': 'PSV', 'country': 'Holanda', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/197.png'},
    {'id': 247, 'name': 'Feyenoord', 'code': 'FEY', 'country': 'Holanda', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/247.png'},
    {'id': 645, 'name': 'Fenerbahçe', 'code': 'FEN', 'country': 'Turquia', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/645.png'},
    {'id': 550, 'name': 'Shakhtar Donetsk', 'code': 'SHK', 'country': 'Ucrânia', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/550.png'},
    {'id': 543, 'name': 'Real Betis', 'code': 'BET', 'country': 'Espanha', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/543.png'},
    {'id': 79, 'name': 'Lille', 'code': 'LIL', 'country': 'França', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/79.png'},
    {'id': 172, 'name': 'VfB Stuttgart', 'code': 'STU', 'country': 'Alemanha', 'pot': 3, 'logo': 'https://media.api-sports.io/football/teams/172.png'},

    {'id': 48, 'name': 'Aston Villa', 'code': 'AVL', 'country': 'Inglaterra', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/48.png'},
    {'id': 116, 'name': 'Lens', 'code': 'RCL', 'country': 'França', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/116.png'},
    {'id': 867, 'name': 'Como 1907', 'code': 'COM', 'country': 'Itália', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/867.png'},
    {'id': 1056, 'name': 'Bodø/Glimt', 'code': 'BOD', 'country': 'Noruega', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/1056.png'},
    {'id': 600, 'name': 'AEK Athens', 'code': 'AEK', 'country': 'Grécia', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/600.png'},
    {'id': 200, 'name': 'LASK', 'code': 'LASK', 'country': 'Áustria', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/200.png'},
    {'id': 560, 'name': 'Slavia Praha', 'code': 'SLA', 'country': 'República Tcheca', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/560.png'},
    {'id': 640, 'name': 'Slovan Bratislava', 'code': 'SLO', 'country': 'Eslováquia', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/640.png'},
    {'id': 1040, 'name': 'Viking FK', 'code': 'VIK', 'country': 'Noruega', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/1040.png'},
    {'id': 950, 'name': 'Sabah FK', 'code': 'SAB', 'country': 'Azerbaijão', 'pot': 4, 'logo': 'https://media.api-sports.io/football/teams/950.png'},
  ];

  // --- 2. Mapeamento de Sorteio Oficial (Casa / Fora) ---
  static const Map<String, Map<String, List<String>>> drawSchedule = {
    'AEK Athens': {
      'home': ['Real Madrid', 'Roma', 'Galatasaray', 'LASK'],
      'away': ['Manchester City', 'Borussia Dortmund', 'Shakhtar Donetsk', 'Como 1907'],
    },
    'Arsenal': {
      'home': ['Real Madrid', 'Borussia Dortmund', 'Lille', 'Sabah FK'],
      'away': ['Bayern München', 'Real Betis', 'Napoli', 'Slavia Praha'],
    },
    'Aston Villa': {
      'home': ['Paris Saint-Germain', 'Borussia Dortmund', 'Fenerbahçe', 'Viking FK'],
      'away': ['Barcelona', 'Club Brugge', 'Galatasaray', 'Slavia Praha'],
    },
    'Atlético de Madrid': {
      'home': ['Bayern München', 'Manchester United', 'Fenerbahçe', 'Viking FK'],
      'away': ['Liverpool', 'PSV Eindhoven', 'Bodø/Glimt', 'VfB Stuttgart'],
    },
    'Barcelona': {
      'home': ['Manchester City', 'Aston Villa', 'Feyenoord', 'Como 1907'],
      'away': ['Paris Saint-Germain', 'Sporting CP', 'Galatasaray', 'Sabah FK'],
    },
    'Bayern München': {
      'home': ['Arsenal', 'Real Betis', 'Bodø/Glimt', 'Slavia Praha'],
      'away': ['Atlético de Madrid', 'Manchester United', 'Lille', 'Viking FK'],
    },
    'Bodø/Glimt': {
      'home': ['Atlético de Madrid', 'Borussia Dortmund', 'Lille', 'LASK'],
      'away': ['Bayern München', 'Club Brugge', 'Napoli', 'Lens'],
    },
    'Borussia Dortmund': {
      'home': ['Internazionale', 'Real Betis', 'Villarreal', 'AEK Athens'],
      'away': ['Arsenal', 'Aston Villa', 'Bodø/Glimt', 'Sabah FK'],
    },
    'Club Brugge': {
      'home': ['Liverpool', 'Aston Villa', 'Bodø/Glimt', 'Lens'],
      'away': ['Internazionale', 'PSV Eindhoven', 'Napoli', 'VfB Stuttgart'],
    },
    'Como 1907': {
      'home': ['Paris Saint-Germain', 'Manchester United', 'RB Leipzig', 'AEK Athens'],
      'away': ['Barcelona', 'Real Betis', 'Feyenoord', 'Lens'],
    },
    'Fenerbahçe': {
      'home': ['Liverpool', 'Roma', 'Villarreal', 'Slavia Praha'],
      'away': ['Atlético de Madrid', 'Aston Villa', 'Shakhtar Donetsk', 'LASK'],
    },
    'Feyenoord': {
      'home': ['Internazionale', 'Porto', 'RB Leipzig', 'Como 1907'],
      'away': ['Barcelona', 'Real Betis', 'Galatasaray', 'Viking FK'],
    },
    'Galatasaray': {
      'home': ['Barcelona', 'Aston Villa', 'Feyenoord', 'VfB Stuttgart'],
      'away': ['Paris Saint-Germain', 'Sporting CP', 'Lille', 'AEK Athens'],
    },
    'Internazionale': {
      'home': ['Liverpool', 'Club Brugge', 'Shakhtar Donetsk', 'VfB Stuttgart'],
      'away': ['Real Madrid', 'Borussia Dortmund', 'Feyenoord', 'Slovan Bratislava'],
    },
    'LASK': {
      'home': ['Liverpool', 'Porto', 'Fenerbahçe', 'Slovan Bratislava'],
      'away': ['Real Madrid', 'Sporting CP', 'Bodø/Glimt', 'AEK Athens'],
    },
    'RB Leipzig': {
      'home': ['Manchester City', 'PSV Eindhoven', 'Shakhtar Donetsk', 'Lens'],
      'away': ['Real Madrid', 'Manchester United', 'Feyenoord', 'Como 1907'],
    },
    'Lens': {
      'home': ['Manchester City', 'Sporting CP', 'Bodø/Glimt', 'Como 1907'],
      'away': ['Liverpool', 'Club Brugge', 'RB Leipzig', 'Slavia Praha'],
    },
    'Lille': {
      'home': ['Bayern München', 'Real Betis', 'Galatasaray', 'Slovan Bratislava'],
      'away': ['Arsenal', 'Roma', 'Bodø/Glimt', 'VfB Stuttgart'],
    },
    'Liverpool': {
      'home': ['Atlético de Madrid', 'Porto', 'Villarreal', 'Lens'],
      'away': ['Internazionale', 'Club Brugge', 'Fenerbahçe', 'LASK'],
    },
    'Manchester City': {
      'home': ['Paris Saint-Germain', 'Sporting CP', 'Napoli', 'AEK Athens'],
      'away': ['Barcelona', 'Porto', 'RB Leipzig', 'Lens'],
    },
    'Manchester United': {
      'home': ['Bayern München', 'Roma', 'RB Leipzig', 'Sabah FK'],
      'away': ['Atlético de Madrid', 'Sporting CP', 'Villarreal', 'Como 1907'],
    },
    'Napoli': {
      'home': ['Arsenal', 'Club Brugge', 'Bodø/Glimt', 'Viking FK'],
      'away': ['Manchester City', 'Porto', 'Villarreal', 'Sabah FK'],
    },
    'Paris Saint-Germain': {
      'home': ['Barcelona', 'Roma', 'Galatasaray', 'Slovan Bratislava'],
      'away': ['Manchester City', 'Aston Villa', 'Villarreal', 'Como 1907'],
    },
    'Porto': {
      'home': ['Manchester City', 'PSV Eindhoven', 'Napoli', 'Slavia Praha'],
      'away': ['Liverpool', 'Real Betis', 'Feyenoord', 'LASK'],
    },
    'PSV Eindhoven': {
      'home': ['Atlético de Madrid', 'Club Brugge', 'Shakhtar Donetsk', 'VfB Stuttgart'],
      'away': ['Real Madrid', 'Porto', 'RB Leipzig', 'Viking FK'],
    },
    'Real Betis': {
      'home': ['Arsenal', 'Porto', 'Feyenoord', 'Como 1907'],
      'away': ['Bayern München', 'Borussia Dortmund', 'Lille', 'Slovan Bratislava'],
    },
    'Real Madrid': {
      'home': ['Internazionale', 'PSV Eindhoven', 'RB Leipzig', 'LASK'],
      'away': ['Arsenal', 'Roma', 'Shakhtar Donetsk', 'AEK Athens'],
    },
    'Roma': {
      'home': ['Real Madrid', 'Sporting CP', 'Lille', 'Slovan Bratislava'],
      'away': ['Paris Saint-Germain', 'Manchester United', 'Fenerbahçe', 'AEK Athens'],
    },
    'Sabah FK': {
      'home': ['Barcelona', 'Borussia Dortmund', 'Napoli', 'Slavia Praha'],
      'away': ['Arsenal', 'Manchester United', 'Villarreal', 'Viking FK'],
    },
    'Shakhtar Donetsk': {
      'home': ['Real Madrid', 'Sporting CP', 'Fenerbahçe', 'AEK Athens'],
      'away': ['Internazionale', 'PSV Eindhoven', 'RB Leipzig', 'Slovan Bratislava'],
    },
    'Slavia Praha': {
      'home': ['Arsenal', 'Aston Villa', 'Villarreal', 'Lens'],
      'away': ['Bayern München', 'Porto', 'Fenerbahçe', 'Sabah FK'],
    },
    'Slovan Bratislava': {
      'home': ['Internazionale', 'Real Betis', 'Shakhtar Donetsk', 'VfB Stuttgart'],
      'away': ['Paris Saint-Germain', 'Roma', 'Lille', 'LASK'],
    },
    'Sporting CP': {
      'home': ['Barcelona', 'Manchester United', 'Galatasaray', 'LASK'],
      'away': ['Manchester City', 'Roma', 'Shakhtar Donetsk', 'Lens'],
    },
    'VfB Stuttgart': {
      'home': ['Atlético de Madrid', 'Club Brugge', 'Lille', 'Viking FK'],
      'away': ['Internazionale', 'PSV Eindhoven', 'Galatasaray', 'Slovan Bratislava'],
    },
    'Viking FK': {
      'home': ['Bayern München', 'PSV Eindhoven', 'Feyenoord', 'Sabah FK'],
      'away': ['Atlético de Madrid', 'Aston Villa', 'Napoli', 'VfB Stuttgart'],
    },
    'Villarreal': {
      'home': ['Paris Saint-Germain', 'Manchester United', 'Napoli', 'Sabah FK'],
      'away': ['Liverpool', 'Borussia Dortmund', 'Fenerbahçe', 'Slavia Praha'],
    },
  };

  // --- 3. Datas Oficiais das Rodadas da Fase de Liga 2026/27 ---
  static const List<Map<String, String>> matchdays = [
    {'round': 'Rodada 1', 'date': '2026-09-08T20:00:00Z', 'period': '08–10/09/2026'},
    {'round': 'Rodada 2', 'date': '2026-10-13T20:00:00Z', 'period': '13–14/10/2026'},
    {'round': 'Rodada 3', 'date': '2026-10-20T20:00:00Z', 'period': '20–21/10/2026'},
    {'round': 'Rodada 4', 'date': '2026-11-03T20:00:00Z', 'period': '03–04/11/2026'},
    {'round': 'Rodada 5', 'date': '2026-11-24T20:00:00Z', 'period': '24–25/11/2026'},
    {'round': 'Rodada 6', 'date': '2026-12-08T20:00:00Z', 'period': '08–09/12/2026'},
    {'round': 'Rodada 7', 'date': '2027-01-19T20:00:00Z', 'period': '19–20/01/2027'},
    {'round': 'Rodada 8', 'date': '2027-01-27T20:00:00Z', 'period': '27/01/2027'},
  ];

  /// Gera a tabela de classificação inicial (36 clubes com 0 pontos)
  static List<Standing> getInitialStandings() {
    return List.generate(clubsRaw.length, (i) {
      final club = clubsRaw[i];
      final rank = i + 1;

      String desc = '';
      if (rank <= 8) {
        desc = 'Oitavas de Final (Direto)';
      } else if (rank <= 24) {
        desc = 'Play-off Eliminatório';
      } else {
        desc = 'Eliminado';
      }

      return Standing(
        rank: rank,
        teamId: club['id'] as int,
        teamName: club['name'] as String,
        teamLogo: club['logo'] as String,
        points: 0,
        played: 0,
        win: 0,
        draw: 0,
        lose: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDiff: 0,
        group: 'Fase de Liga',
        description: desc,
      );
    });
  }

  /// Gera todas as 144 partidas da Fase de Liga com base no sorteio oficial
  static List<Fixture> getScheduledFixtures() {
    final Map<String, Map<String, dynamic>> clubsMap = {
      for (var c in clubsRaw) (c['name'] as String).toLowerCase(): c,
    };

    // Obter todas as duplas únicas (Home vs Away)
    final Set<String> processedKeys = {};
    final List<Map<String, dynamic>> pairs = [];

    drawSchedule.forEach((homeClub, opponents) {
      final homeOpponents = opponents['home'] ?? [];
      for (var awayClub in homeOpponents) {
        final key = '${homeClub.toLowerCase()}_vs_${awayClub.toLowerCase()}';
        if (!processedKeys.contains(key)) {
          processedKeys.add(key);
          pairs.add({
            'home': homeClub,
            'away': awayClub,
          });
        }
      }
    });

    final List<Fixture> fixtures = [];
    int matchIdCounter = 1;

    // Distribuir as 144 partidas entre as 8 rodadas (18 jogos por rodada)
    for (int i = 0; i < pairs.length; i++) {
      final pair = pairs[i];
      final roundIndex = (i % 8);
      final md = matchdays[roundIndex];

      final homeMeta = clubsMap[pair['home'].toString().toLowerCase()];
      final awayMeta = clubsMap[pair['away'].toString().toLowerCase()];

      final hTeam = Team(
        id: (homeMeta?['id'] ?? (1000 + i)).toString(),
        externalId: homeMeta?['id'] ?? (1000 + i),
        name: pair['home'],
        logo: homeMeta?['logo'],
      );

      final aTeam = Team(
        id: (awayMeta?['id'] ?? (2000 + i)).toString(),
        externalId: awayMeta?['id'] ?? (2000 + i),
        name: pair['away'],
        logo: awayMeta?['logo'],
      );

      fixtures.add(Fixture(
        id: 'ucl_2026_27_${matchIdCounter.toString().padLeft(3, '0')}',
        externalId: 900000 + matchIdCounter,
        leagueId: '2',
        season: 2026,
        date: DateTime.parse(md['date']!),
        statusLong: 'Agendado',
        statusShort: 'NS',
        homeTeamId: hTeam.id,
        awayTeamId: aTeam.id,
        homeTeam: hTeam,
        awayTeam: aTeam,
        round: md['round']!,
      ));

      matchIdCounter++;
    }

    return fixtures;
  }

  /// Gera os confrontos mata-mata oficiais da temporada 2026/27
  static List<Tie> getKnockoutTies() {
    final List<Tie> ties = [];

    // 1. Play-offs Eliminatórios (16/17 e 23/24 Fev 2027)
    final playoffSeeds = [
      {'name': 'Play-off 1 (9º vs 24º)', 'd1': '16/02/2027', 'd2': '23/02/2027'},
      {'name': 'Play-off 2 (10º vs 23º)', 'd1': '16/02/2027', 'd2': '23/02/2027'},
      {'name': 'Play-off 3 (11º vs 22º)', 'd1': '17/02/2027', 'd2': '24/02/2027'},
      {'name': 'Play-off 4 (12º vs 21º)', 'd1': '17/02/2027', 'd2': '24/02/2027'},
      {'name': 'Play-off 5 (13º vs 20º)', 'd1': '16/02/2027', 'd2': '23/02/2027'},
      {'name': 'Play-off 6 (14º vs 19º)', 'd1': '16/02/2027', 'd2': '23/02/2027'},
      {'name': 'Play-off 7 (15º vs 18º)', 'd1': '17/02/2027', 'd2': '24/02/2027'},
      {'name': 'Play-off 8 (16º vs 17º)', 'd1': '17/02/2027', 'd2': '24/02/2027'},
    ];

    for (int i = 0; i < playoffSeeds.length; i++) {
      final p = playoffSeeds[i];
      ties.add(Tie(
        id: 'tie_po_${i + 1}',
        phaseId: 'champions_knockout',
        title: 'Play-offs (16/17 e 23/24 Fev)',
        homeTeam: Team(id: 'po_h_${i + 1}', externalId: 0, name: 'A Definir (9º-16º)'),
        awayTeam: Team(id: 'po_a_${i + 1}', externalId: 0, name: 'A Definir (17º-24º)'),
      ));
    }

    // 2. Oitavas de Final (09/10 e 16/17 Mar 2027)
    for (int i = 1; i <= 8; i++) {
      ties.add(Tie(
        id: 'tie_r16_$i',
        phaseId: 'champions_knockout',
        title: 'Oitavas de Final (09/10 e 16/17 Mar)',
        homeTeam: Team(id: 'r16_h_$i', externalId: 0, name: 'Top 8 (1º ao 8º)'),
        awayTeam: Team(id: 'r16_a_$i', externalId: 0, name: 'Vencedor Play-off $i'),
      ));
    }

    // 3. Quartas de Final (06/07 e 13/14 Abr 2027)
    for (int i = 1; i <= 4; i++) {
      ties.add(Tie(
        id: 'tie_qf_$i',
        phaseId: 'champions_knockout',
        title: 'Quartas de Final (06/07 e 13/14 Abr)',
        homeTeam: Team(id: 'qf_h_$i', externalId: 0, name: 'Vencedor Oitavas ${i * 2 - 1}'),
        awayTeam: Team(id: 'qf_a_$i', externalId: 0, name: 'Vencedor Oitavas ${i * 2}'),
      ));
    }

    // 4. Semifinais (27/28 Abr e 04/05 Mai 2027)
    for (int i = 1; i <= 2; i++) {
      ties.add(Tie(
        id: 'tie_sf_$i',
        phaseId: 'champions_knockout',
        title: 'Semifinais (27/28 Abr e 04/05 Mai)',
        homeTeam: Team(id: 'sf_h_$i', externalId: 0, name: 'Vencedor Quartas ${i * 2 - 1}'),
        awayTeam: Team(id: 'sf_a_$i', externalId: 0, name: 'Vencedor Quartas ${i * 2}'),
      ));
    }

    // 5. Grande Final (05/06/2027 - Estadio Metropolitano, Madrid)
    ties.add(Tie(
      id: 'tie_final',
      phaseId: 'champions_knockout',
      title: 'Final (05/06/2027 - Estadio Metropolitano, Madrid)',
      homeTeam: Team(id: 'fin_h', externalId: 0, name: 'Finalista 1'),
      awayTeam: Team(id: 'fin_a', externalId: 0, name: 'Finalista 2'),
    ));

    return ties;
  }
}
