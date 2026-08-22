import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../../../helpers/helpers.dart';
import '../../logic/models/tie.dart';
import '../../logic/models/team.dart';
import 'widgets.dart';

class CompetitionBracketWidget extends StatelessWidget {
  final List<Tie> ties;
  final String? phaseDescription;

  const CompetitionBracketWidget({
    super.key,
    required this.ties,
    this.phaseDescription,
  });

  @override
  Widget build(BuildContext context) {
    if (ties.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Column(
            children: [
              Icon(Icons.sports_soccer_outlined, size: 40, color: Colors.grey.withOpacity(0.5)),
              const Gap(10),
              Text(
                'Confrontos ainda não definidos',
                style: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (phaseDescription != null && phaseDescription!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: AppColor.accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColor.accent.withOpacity(0.3)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, size: 18, color: AppColor.accent),
                const Gap(8),
                Expanded(
                  child: Text(
                    phaseDescription!,
                    style: GoogleFonts.urbanist(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.9),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: ties.length,
          separatorBuilder: (_, __) => const Gap(12),
          itemBuilder: (context, index) {
            final tie = ties[index];
            return _TieCard(tie: tie);
          },
        ),
      ],
    );
  }
}

class _TieCard extends StatelessWidget {
  final Tie tie;

  const _TieCard({required this.tie});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header do Confronto
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                tie.title,
                style: GoogleFonts.urbanist(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColor.accent,
                ),
              ),
              if (tie.isTwoLegged)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Ida e Volta',
                    style: GoogleFonts.urbanist(fontSize: 11, color: Colors.grey),
                  ),
                ),
            ],
          ),
          const Gap(10),

          // Time Mandante / Seed 1
          _buildTeamRow(
            context: context,
            team: tie.homeTeam,
            seed: tie.seedHome,
            isWinner: tie.winner?.externalId == tie.homeTeam?.externalId && tie.homeTeam != null,
            score1: tie.leg1?.homeGoals,
            score2: tie.isTwoLegged ? (tie.leg2?.awayGoals ?? (tie.leg2?.homeTeam?.externalId == tie.homeTeam?.externalId ? tie.leg2?.homeGoals : null)) : null,
            aggScore: tie.homeAggregateScore,
          ),
          const Gap(8),
          Divider(color: Theme.of(context).dividerColor.withOpacity(0.1), height: 1),
          const Gap(8),

          // Time Visitante / Seed 2
          _buildTeamRow(
            context: context,
            team: tie.awayTeam,
            seed: tie.seedAway,
            isWinner: tie.winner?.externalId == tie.awayTeam?.externalId && tie.awayTeam != null,
            score1: tie.leg1?.awayGoals,
            score2: tie.isTwoLegged ? (tie.leg2?.homeGoals ?? (tie.leg2?.awayTeam?.externalId == tie.awayTeam?.externalId ? tie.leg2?.awayGoals : null)) : null,
            aggScore: tie.awayAggregateScore,
          ),

          if (tie.penalties != null && tie.penalties!.isNotEmpty) ...[
            const Gap(8),
            Center(
              child: Text(
                'Pênaltis: ${tie.penalties}',
                style: GoogleFonts.urbanist(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.amber,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTeamRow({
    required BuildContext context,
    required Team? team,
    required String? seed,
    required bool isWinner,
    required int? score1,
    required int? score2,
    required int? aggScore,
  }) {
    return Row(
      children: [
        // Logo
        SizedBox(
          width: 26,
          height: 26,
          child: team?.logo != null && team!.logo!.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: proxyImage(team.logo!),
                  fit: BoxFit.contain,
                  errorWidget: (_, __, ___) => const CardNoImage(radius: 5),
                )
              : const CardNoImage(radius: 5),
        ),
        const Gap(10),
        // Nome e Seed
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                team?.name ?? (seed ?? 'A definir'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.urbanist(
                  fontSize: 14,
                  fontWeight: isWinner ? FontWeight.bold : FontWeight.w600,
                  color: isWinner
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.onSurface,
                ),
              ),
              if (seed != null && team != null)
                Text(
                  seed,
                  style: GoogleFonts.urbanist(fontSize: 11, color: Colors.grey),
                ),
            ],
          ),
        ),
        // Scores
        if (score1 != null) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '$score1',
              style: GoogleFonts.urbanist(
                fontSize: 13,
                fontWeight: isWinner ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
        if (score2 != null) ...[
          const Gap(4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '$score2',
              style: GoogleFonts.urbanist(
                fontSize: 13,
                fontWeight: isWinner ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
        if (aggScore != null && tie.isTwoLegged) ...[
          const Gap(6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: isWinner ? AppColor.accent.withOpacity(0.2) : Colors.white10,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'Ag: $aggScore',
              style: GoogleFonts.urbanist(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isWinner ? AppColor.accent : null,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
