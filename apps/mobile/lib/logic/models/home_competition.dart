import '../models/league.dart';
import '../models/fixture.dart';

class HomeCompetition {
  final League league;
  final Fixture? recentMatch;

  HomeCompetition({required this.league, this.recentMatch});
}
