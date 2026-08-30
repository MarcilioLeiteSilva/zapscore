import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/fixture.dart';

import '../../models/standing.dart';
import '../../models/scorer.dart';

part 'league_state.dart';

class LeagueCubit extends Cubit<LeagueState> {
  final ApiClient apiClient;

  LeagueCubit(this.apiClient) : super(LeagueInitial());

  Future<void> fetchLeagueData(int leagueId) async {
    emit(LeagueLoading());
    try {
      final results = await Future.wait([
        apiClient.getRecentFixtures(leagueId, limit: 500),
        apiClient.getStandings(leagueId),
        apiClient.getScorers(leagueId),
      ]);

      final fixtures = results[0] as List<Fixture>;
      
      // Extract unique rounds and ensure all 34 rounds exist for Bundesliga
      final rounds = fixtures.map((f) => f.round ?? 'N/A').toSet().toList();
      final roundSet = rounds.toSet();
      for (int i = 1; i <= 34; i++) {
        final roundStr = 'Regular Season - $i';
        if (!roundSet.contains(roundStr)) {
          rounds.add(roundStr);
        }
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

      // Find "current" round: first round that has a match today or in the future
      final now = DateTime.now();
      final futureFixture = fixtures.firstWhere(
        (f) => f.date.isAfter(now.subtract(const Duration(hours: 4))),
        orElse: () => fixtures.isNotEmpty ? fixtures.last : Fixture.dummy(),
      );
      final currentRound = futureFixture.round ?? (rounds.isNotEmpty ? rounds.first : 'N/A');

      emit(LeagueLoaded(
        fixtures: fixtures,
        standings: results[1] as List<Standing>,
        scorers: results[2] as List<Scorer>,
        rounds: rounds,
        selectedRound: currentRound,
      ));
    } catch (e) {
      emit(LeagueError(e.toString()));
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
      final index = currentState.rounds.indexOf(currentState.selectedRound);
      if (index != -1 && index < currentState.rounds.length - 1) {
        changeRound(currentState.rounds[index + 1]);
      }
    }
  }

  void prevRound() {
    if (state is LeagueLoaded) {
      final currentState = state as LeagueLoaded;
      final index = currentState.rounds.indexOf(currentState.selectedRound);
      if (index > 0) {
        changeRound(currentState.rounds[index - 1]);
      }
    }
  }
}
