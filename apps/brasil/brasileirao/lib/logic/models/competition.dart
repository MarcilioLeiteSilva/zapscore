import 'competition_phase.dart';

enum DivisionLevel { a1, a2, b1, other }

class CompetitionRules {
  final int? qualificationCount;
  final int? relegationCount;
  final int? promotionCount;
  final String? promotedTo;
  final String? relegatedTo;
  final bool advantageForSeed;
  final List<String> tiebreakCriteria;

  const CompetitionRules({
    this.qualificationCount,
    this.relegationCount,
    this.promotionCount,
    this.promotedTo,
    this.relegatedTo,
    this.advantageForSeed = false,
    this.tiebreakCriteria = const [
      'points',
      'wins',
      'goal_diff',
      'goals_for',
      'head_to_head'
    ],
  });
}

class Competition {
  final String id;
  final int externalId;
  final String name;
  final String? logo;
  final String country;
  final int season;
  final DivisionLevel division;
  final List<CompetitionPhase> phases;
  final CompetitionRules rules;

  Competition({
    required this.id,
    required this.externalId,
    required this.name,
    this.logo,
    this.country = 'Brazil',
    required this.season,
    this.division = DivisionLevel.a1,
    required this.phases,
    this.rules = const CompetitionRules(),
  });

  CompetitionPhase? getPhase(String phaseId) {
    try {
      return phases.firstWhere((p) => p.id == phaseId);
    } catch (_) {
      return phases.isNotEmpty ? phases.first : null;
    }
  }
}
