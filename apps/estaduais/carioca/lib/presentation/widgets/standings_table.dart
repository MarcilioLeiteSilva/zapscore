import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:gap/gap.dart';
import '../../../helpers/helpers.dart';
import '../../logic/models/standing.dart';
import 'widgets.dart';

class StandingsTableWidget extends StatelessWidget {
  final List<Standing> standings;
  final String? groupTitle;
  final int qualificationCount;
  final int relegationCount;
  final String? qualificationDescription;
  final String? relegationDescription;

  const StandingsTableWidget({
    super.key,
    required this.standings,
    this.groupTitle,
    this.qualificationCount = 4,
    this.relegationCount = 0,
    this.qualificationDescription,
    this.relegationDescription,
  });

  @override
  Widget build(BuildContext context) {
    if (standings.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 30),
          child: Text(
            'Nenhuma classificação disponível',
            style: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14),
          ),
        ),
      );
    }

    final totalTeams = standings.length;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Theme.of(context).cardColor,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (groupTitle != null && groupTitle!.isNotEmpty) ...[
            Row(
              children: [
                Container(
                  width: 4,
                  height: 16,
                  decoration: BoxDecoration(
                    color: AppColor.accent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const Gap(8),
                Text(
                  groupTitle!,
                  style: GoogleFonts.urbanist(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            const Gap(12),
          ],
          Table(
            columnWidths: const {
              0: FlexColumnWidth(0.8), // #
              1: FlexColumnWidth(4.2), // TIME
              2: FlexColumnWidth(1.2), // P
              3: FlexColumnWidth(1.0), // J
              4: FlexColumnWidth(1.0), // V
              5: FlexColumnWidth(1.0), // E
              6: FlexColumnWidth(1.0), // D
              7: FlexColumnWidth(1.2), // SG
            },
            children: [
              TableRow(
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Theme.of(context).dividerColor.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                ),
                children: const [
                  _TableHeaderItem('#', isCrossCenter: true),
                  _TableHeaderItem('TIME'),
                  _TableHeaderItem('P'),
                  _TableHeaderItem('J'),
                  _TableHeaderItem('V'),
                  _TableHeaderItem('E'),
                  _TableHeaderItem('D'),
                  _TableHeaderItem('SG'),
                ],
              ),
              for (int i = 0; i < standings.length; i++)
                _buildTableRow(context, standings[i], i, totalTeams),
            ],
          ),
          if (qualificationDescription != null || relegationDescription != null) ...[
            const Gap(14),
            Divider(color: Theme.of(context).dividerColor.withOpacity(0.15)),
            const Gap(8),
            if (qualificationDescription != null)
              _buildLegendItem(
                color: const Color(0xFF10B981),
                text: qualificationDescription!,
              ),
            if (relegationDescription != null) ...[
              const Gap(4),
              _buildLegendItem(
                color: const Color(0xFFEF4444),
                text: relegationDescription!,
              ),
            ],
          ],
        ],
      ),
    );
  }

  TableRow _buildTableRow(BuildContext context, Standing standing, int index, int totalTeams) {
    final rank = index + 1;
    final isQualified = rank <= qualificationCount;
    final isRelegated = relegationCount > 0 && rank > (totalTeams - relegationCount);

    Color? indicatorColor;
    if (isQualified) indicatorColor = const Color(0xFF10B981);
    if (isRelegated) indicatorColor = const Color(0xFFEF4444);

    return TableRow(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      children: [
        // Posição com indicador de cor
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (indicatorColor != null)
                Container(
                  width: 3,
                  height: 14,
                  margin: const EdgeInsets.only(right: 4),
                  decoration: BoxDecoration(
                    color: indicatorColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              Text(
                '$rank',
                style: GoogleFonts.urbanist(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: indicatorColor ?? Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
        // Time com logo
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              SizedBox(
                width: 22,
                height: 22,
                child: standing.teamLogo != null && standing.teamLogo!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: proxyImage(standing.teamLogo!),
                        fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const CardNoImage(radius: 4),
                      )
                    : const CardNoImage(radius: 4),
              ),
              const Gap(8),
              Expanded(
                child: Text(
                  standing.teamName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.urbanist(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
        _TableCellItem('${standing.points}', isBold: true),
        _TableCellItem('${standing.played}'),
        _TableCellItem('${standing.win}'),
        _TableCellItem('${standing.draw}'),
        _TableCellItem('${standing.lose}'),
        _TableCellItem('${standing.goalsDiff}'),
      ],
    );
  }

  Widget _buildLegendItem({required Color color, required String text}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 8,
          height: 8,
          margin: const EdgeInsets.only(top: 4, right: 6),
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.urbanist(
              fontSize: 11,
              color: Colors.grey,
            ),
          ),
        ),
      ],
    );
  }
}

class _TableHeaderItem extends StatelessWidget {
  final String text;
  final bool isCrossCenter;

  const _TableHeaderItem(this.text, {this.isCrossCenter = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        textAlign: isCrossCenter ? TextAlign.center : TextAlign.start,
        style: GoogleFonts.urbanist(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey,
        ),
      ),
    );
  }
}

class _TableCellItem extends StatelessWidget {
  final String text;
  final bool isBold;

  const _TableCellItem(this.text, {this.isBold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(
        text,
        textAlign: TextAlign.start,
        style: GoogleFonts.urbanist(
          fontSize: 13,
          fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
    );
  }
}
