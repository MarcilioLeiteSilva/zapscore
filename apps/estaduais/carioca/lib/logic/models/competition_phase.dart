import 'fixture.dart';
import 'standing.dart';
import 'tie.dart';

enum PhaseType {
  groupStage,
  league,
  knockout,
  relegation,
  playoff,
  finalStage,
}

class PhaseGroup {
  final String id;
  final String name; // e.g. "Grupo A", "Grupo B"
  final List<Standing> standings;
  final List<Fixture> fixtures;

  const PhaseGroup({
    required this.id,
    required this.name,
    this.standings = const [],
    this.fixtures = const [],
  });
}

class PhaseRound {
  final String id;
  final int number;
  final String name; // e.g. "1ª Rodada", "Rodada 1"
  final List<Fixture> fixtures;

  const PhaseRound({
    required this.id,
    required this.number,
    required this.name,
    this.fixtures = const [],
  });
}

class CompetitionPhase {
  final String id;
  final String name;
  final PhaseType type;
  final int legs; // 1 = jogo único, 2 = ida e volta
  final List<PhaseGroup> groups;
  final List<PhaseRound> rounds;
  final List<Fixture> fixtures;
  final List<Standing> standings;
  final List<Tie> ties; // Para fases eliminatórias (bracket)
  final String? qualificationRuleDescription;
  final String? relegationRuleDescription;

  const CompetitionPhase({
    required this.id,
    required this.name,
    required this.type,
    this.legs = 1,
    this.groups = const [],
    this.rounds = const [],
    this.fixtures = const [],
    this.standings = const [],
    this.ties = const [],
    this.qualificationRuleDescription,
    this.relegationRuleDescription,
  });

  bool get isGroupStage => type == PhaseType.groupStage;
  bool get isLeague => type == PhaseType.league;
  bool get isKnockout => type == PhaseType.knockout || type == PhaseType.finalStage || type == PhaseType.playoff;
  bool get isRelegation => type == PhaseType.relegation;
}
