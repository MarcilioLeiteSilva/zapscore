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
        apiClient.getRecentFixtures(leagueId, limit: 100),
        apiClient.getStandings(leagueId),
        apiClient.getScorers(leagueId),
      ]);

      final fixtures = results[0] as List<Fixture>;
      
      // Extract unique rounds and sort them if possible
      final rounds = fixtures.map((f) => f.round ?? 'N/A').toSet().toList();
      // Simple sort (might need better logic for Regular Season - 10 vs 2)
      rounds.sort();

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
