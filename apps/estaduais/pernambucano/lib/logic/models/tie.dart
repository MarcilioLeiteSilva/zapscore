import 'fixture.dart';
import 'team.dart';

class Tie {
  final String id;
  final String phaseId;
  final String title; // e.g. "Quartas de Final 1", "Semifinal 1"
  final String? seedHome; // e.g. "1º Grupo A"
  final String? seedAway; // e.g. "4º Grupo A"
  final Team? homeTeam;
  final Team? awayTeam;
  final Fixture? leg1; // Jogo de ida (ou jogo único)
  final Fixture? leg2; // Jogo de volta (se houver)
  final int? homeAggregateScore;
  final int? awayAggregateScore;
  final String? penalties; // e.g. "4 - 3"
  final Team? winner;
  final bool advantageForHigherSeed;
  final String? nextRoundTieId; // Chaveamento dinâmico para próxima fase

  const Tie({
    required this.id,
    required this.phaseId,
    required this.title,
    this.seedHome,
    this.seedAway,
    this.homeTeam,
    this.awayTeam,
    this.leg1,
    this.leg2,
    this.homeAggregateScore,
    this.awayAggregateScore,
    this.penalties,
    this.winner,
    this.advantageForHigherSeed = false,
    this.nextRoundTieId,
  });

  bool get isTwoLegged => leg2 != null;
  bool get isFinished => winner != null || (leg1?.statusShort == 'FT' && (leg2 == null || leg2?.statusShort == 'FT'));
}
