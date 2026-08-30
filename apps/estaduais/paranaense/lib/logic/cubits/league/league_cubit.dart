import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';
import '../../models/standing.dart';
import '../../models/scorer.dart';
import '../../models/competition.dart';
import '../../models/competition_phase.dart';
import '../../engines/competition_normalizer.dart';

part 'league_state.dart';

class LeagueCubit extends Cubit<LeagueState> {
  final ApiClient apiClient;

  LeagueCubit(this.apiClient) : super(LeagueInitial());

  Future<void> fetchLeagueData(int leagueId, {String? initialPhaseId}) async {
    emit(LeagueLoading());
    try {
      final results = await Future.wait([
        apiClient.getRecentFixtures(leagueId, limit: 500),
        apiClient.getStandings(leagueId),
        apiClient.getScorers(leagueId),
      ]);

      final fixtures = results[0] as List<Fixture>;
      final standings = results[1] as List<Standing>;
      final scorers = results[2] as List<Scorer>;

      // Obter nome da competição
      String compName = leagueId == 614 ? 'Campeonato Paranaense - Série B' : 'Campeonato Paranaense - Série A';

      // Normalizar via Motor de Competições
      final competition = CompetitionNormalizer.normalize(
        leagueId: leagueId,
        leagueName: compName,
        season: 2026,
        rawStandings: standings,
        rawFixtures: fixtures,
      );

      final defaultPhaseId = initialPhaseId ??
          (competition.phases.isNotEmpty ? competition.phases.first.id : 'primeira_fase_a1');

      // Extrair rodadas dinamicamente
      final rounds = fixtures
          .map((f) => f.round ?? 'N/A')
          .where((r) => r != 'N/A')
          .toSet()
          .toList();
      if (rounds.isEmpty) {
        rounds.add('Regular Season - 1');
      }

      int extractRoundNumber(String r) {
        final match = RegExp(r'\d+').firstMatch(r);
        if (match != null) {
          return int.tryParse(match.group(0)!) ?? 999;
        }
        return 999;
      }

      rounds.sort((a, b) {
        final numA = extractRoundNumber(a);
        final numB = extractRoundNumber(b);
        if (numA != numB) return numA.compareTo(numB);
        return a.compareTo(b);
      });

      // Rodada atual: primeira rodada com jogo hoje ou no futuro
      final now = DateTime.now();
      final futureFixture = fixtures.firstWhere(
        (f) => f.date.isAfter(now.subtract(const Duration(hours: 4))),
        orElse: () => fixtures.isNotEmpty ? fixtures.last : Fixture.dummy(),
      );
      final currentRound = futureFixture.round ?? (rounds.isNotEmpty ? rounds.first : 'N/A');

      emit(LeagueLoaded(
        fixtures: fixtures,
        standings: standings,
        scorers: scorers,
        rounds: rounds,
        selectedRound: currentRound,
        competition: competition,
        selectedLeagueId: leagueId,
        selectedPhaseId: defaultPhaseId,
        selectedGroupIndex: 0,
      ));
    } catch (e) {
      emit(LeagueError(e.toString()));
    }
  }

  List<String> get currentPhaseRounds {
    if (state is! LeagueLoaded) return [];
    final loaded = state as LeagueLoaded;
    final active = loaded.activePhase;
    if (active != null && active.rounds.isNotEmpty) {
      final rounds = active.rounds
          .map((r) => r.fixtures.isNotEmpty && r.fixtures.first.round != null
              ? r.fixtures.first.round!
              : r.name)
          .toSet()
          .toList();
      return rounds;
    }
    return loaded.rounds;
  }

  void switchDivision(int newLeagueId) {
    fetchLeagueData(newLeagueId);
  }

  void selectPhase(String phaseId) {
    if (state is LeagueLoaded) {
      final currentState = state as LeagueLoaded;
      final targetPhase = currentState.competition?.phases.firstWhere(
        (p) => p.id == phaseId,
        orElse: () => currentState.activePhase ?? currentState.competition!.phases.first,
      );

      String newSelectedRound = currentState.selectedRound;
      if (targetPhase != null && targetPhase.rounds.isNotEmpty) {
        final firstFixtureRound = targetPhase.rounds.first.fixtures.isNotEmpty
            ? targetPhase.rounds.first.fixtures.first.round
            : targetPhase.rounds.first.name;
        if (firstFixtureRound != null) {
          newSelectedRound = firstFixtureRound;
        }
      }

      emit(currentState.copyWith(
        selectedPhaseId: phaseId,
        selectedRound: newSelectedRound,
        selectedGroupIndex: 0,
      ));
    }
  }

  void selectGroup(int groupIndex) {
    if (state is LeagueLoaded) {
      final currentState = state as LeagueLoaded;
      emit(currentState.copyWith(selectedGroupIndex: groupIndex));
    }
  }

  void changeRound(String round) {
    if (state is LeagueLoaded) {
      final currentState = state as LeagueLoaded;
      emit(currentState.copyWith(selectedRound: round));
    }
  }

  void nextRound() {
    if (state is LeagueLoaded) {
      final currentState = state as LeagueLoaded;
      final availableRounds = currentPhaseRounds;
      final index = availableRounds.indexOf(currentState.selectedRound);
      if (index != -1 && index < availableRounds.length - 1) {
        changeRound(availableRounds[index + 1]);
      }
    }
  }

  void prevRound() {
    if (state is LeagueLoaded) {
      final currentState = state as LeagueLoaded;
      final availableRounds = currentPhaseRounds;
      final index = availableRounds.indexOf(currentState.selectedRound);
      if (index > 0) {
        changeRound(availableRounds[index - 1]);
      }
    }
  }
}
