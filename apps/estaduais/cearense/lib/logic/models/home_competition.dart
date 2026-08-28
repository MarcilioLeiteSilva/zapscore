import '../models/league.dart';
import '../models/fixture.dart';

class HomeCompetition {
  final League league;
  final List<Fixture> matches;

  HomeCompetition({required this.league, this.matches = const []});
}
