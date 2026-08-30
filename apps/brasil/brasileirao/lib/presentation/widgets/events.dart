part of 'widgets.dart';

class PlayerEventPhoto extends StatelessWidget {
  const PlayerEventPhoto({super.key, this.photo, this.size = 24});
  final String? photo;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: photo != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(size / 2),
              child: CachedNetworkImage(imageUrl: proxyImage(photo!), fit: BoxFit.cover, errorWidget: (_, __, ___) => _buildPlaceholder(context)),
            )
          : _buildPlaceholder(context),
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return CircleAvatar(
      backgroundColor: context.appColors.info,
      radius: size / 2,
      child: Icon(Icons.person, color: Colors.white54, size: size * 0.6),
    );
  }
}

class CardIndicatorThreeH2H extends StatelessWidget {
  const CardIndicatorThreeH2H({
    super.key,
    this.hideMid = false,
    this.homeWins = 0,
    this.draws = 0,
    this.awayWins = 0,
  });
  final bool hideMid;
  final int homeWins;
  final int draws;
  final int awayWins;

  @override
  Widget build(BuildContext context) {
    final total = homeWins + (hideMid ? 0 : draws) + awayWins;
    if (total == 0) {
      return Container(
        height: 15,
        decoration: BoxDecoration(
          color: (context.appColors.info ?? Colors.grey).withOpacity(0.3),
          borderRadius: BorderRadius.circular(15),
        ),
      );
    }

    final homeFlex = ((homeWins / total) * 100).round();
    final drawFlex = hideMid ? 0 : ((draws / total) * 100).round();
    final awayFlex = ((awayWins / total) * 100).round();

    return Row(
      children: [
        if (homeWins > 0)
          Expanded(
            flex: homeFlex > 0 ? homeFlex : 1,
            child: Container(
              height: 15,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
        if (!hideMid && draws > 0) ...[
          if (homeWins > 0) const Gap(10),
          Expanded(
            flex: drawFlex > 0 ? drawFlex : 1,
            child: Container(
              height: 15,
              decoration: BoxDecoration(
                color: context.appColors.info,
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
        ],
        if (awayWins > 0) ...[
          if (homeWins > 0 || (!hideMid && draws > 0)) const Gap(10),
          Expanded(
            flex: awayFlex > 0 ? awayFlex : 1,
            child: Container(
              height: 15,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
        ],
      ],
    );
  }
}


class CardIndicatorEvent extends StatelessWidget {
  const CardIndicatorEvent({super.key, required this.homeValue, required this.awayValue});
  final double homeValue; // 0.0 to 1.0
  final double awayValue; // 0.0 to 1.0

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Stack(
            alignment: Alignment.centerRight,
            children: [
              Container(
                height: 15,
                decoration: BoxDecoration(
                  color: context.appColors.info,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(15),
                    bottomLeft: Radius.circular(15),
                  ),
                ),
              ),
              FractionallySizedBox(
                widthFactor: homeValue,
                child: Container(
                  height: 15,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(15),
                      bottomLeft: Radius.circular(15),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const Gap(10),
        Expanded(
          child: Stack(
            alignment: Alignment.centerLeft,
            children: [
              Container(
                height: 15,
                decoration: BoxDecoration(
                  color: context.appColors.info,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(15),
                    bottomRight: Radius.circular(15),
                  ),
                ),
              ),
              FractionallySizedBox(
                widthFactor: awayValue,
                child: Container(
                  height: 15,
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(15),
                      bottomRight: Radius.circular(15),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class CardEventMatch extends StatelessWidget {
  const CardEventMatch({
    super.key,
    this.events = const [],
    required this.homeTeamId,
    required this.awayTeamId,
  });
  final List<FixtureEvent> events;
  final int homeTeamId;
  final int awayTeamId;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return Container(
        width: context.width,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).cardColor,
          border: Border.all(color: AppColor.info.withOpacity(0.3), width: 1),
        ),
        child: Column(
          children: [
            const Icon(Icons.timeline_rounded, color: Colors.white38, size: 28),
            const Gap(8),
            Text(
              'no_events'.tr(context),
              style: context.textTheme.bodySmall?.copyWith(color: Colors.white60),
            ),
          ],
        ),
      );
    }

    // Ordena os eventos cronologicamente (1' ao 90'+)
    final sortedEvents = List<FixtureEvent>.from(events);
    sortedEvents.sort((a, b) => a.time.compareTo(b.time));

    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Theme.of(context).cardColor,
        border: Border.all(color: AppColor.info.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 6, bottom: 16),
            child: Row(
              children: [
                const Icon(Icons.timeline_rounded, color: AppColor.accent, size: 18),
                const Gap(8),
                Text(
                  'LINHA DO TEMPO DA PARTIDA',
                  style: GoogleFonts.urbanist(
                    textStyle: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Stack(
            children: [
              // Linha vertical central conectora
              Positioned(
                top: 8,
                bottom: 8,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    width: 2,
                    color: Colors.white12,
                  ),
                ),
              ),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: sortedEvents.length,
                itemBuilder: (context, index) {
                  final event = sortedEvents[index];
                  final isHome = event.teamId == homeTeamId;
                  return _buildTimelineRow(context, event, isHome);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineRow(BuildContext context, FixtureEvent event, bool isHome) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Lado Esquerdo (Mandante)
          Expanded(
            child: isHome
                ? _buildTimelineEventCard(context, event, isHome: true)
                : const SizedBox.shrink(),
          ),

          // Centro (Minuto do lance)
          Container(
            width: 46,
            alignment: Alignment.center,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF135B37),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColor.accent, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: AppColor.accent.withOpacity(0.25),
                    blurRadius: 4,
                    spreadRadius: 0.5,
                  ),
                ],
              ),
              child: Text(
                "${event.time}'",
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),

          // Lado Direito (Visitante)
          Expanded(
            child: !isHome
                ? _buildTimelineEventCard(context, event, isHome: false)
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineEventCard(BuildContext context, FixtureEvent event, {required bool isHome}) {
    final type = event.type.toUpperCase();
    final detail = (event.detail ?? '').toLowerCase();
    final playerName = event.player ?? 'Desconhecido';
    final assistName = event.assist ?? '';

    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    Widget? eventBadgeIcon;
    String eventTitle = '';
    Color titleColor = Colors.white;

    if (type == 'GOAL') {
      titleColor = AppColor.accent;
      if (detail.contains('own goal') || detail.contains('contra')) {
        eventBadgeIcon = Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: Colors.redAccent,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF135B37), width: 1),
          ),
          child: const Icon(Icons.sports_soccer, color: Colors.white, size: 9),
        );
        eventTitle = 'Gol Contra';
        titleColor = Colors.redAccent;
      } else if (detail.contains('penalty') || detail.contains('pênalti')) {
        eventBadgeIcon = Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: AppColor.accent,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF135B37), width: 1),
          ),
          child: const Icon(Icons.sports_soccer, color: Colors.white, size: 9),
        );
        eventTitle = 'Gol de Pênalti';
      } else {
        eventBadgeIcon = Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: AppColor.accent,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF135B37), width: 1),
          ),
          child: const Icon(Icons.sports_soccer, color: Colors.white, size: 9),
        );
        eventTitle = 'Gol!';
      }
    } else if (type == 'CARD') {
      final isYellow = detail.contains('yellow') || detail.contains('amarelo');
      eventBadgeIcon = Container(
        padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 2),
        decoration: BoxDecoration(
          color: isYellow ? Colors.amber : Colors.redAccent,
          borderRadius: BorderRadius.circular(2),
          border: Border.all(color: const Color(0xFF135B37), width: 1),
        ),
        child: const SizedBox(width: 4, height: 6),
      );
      eventTitle = isYellow ? 'Cartão Amarelo' : 'Cartão Vermelho';
      titleColor = isYellow ? Colors.amber : Colors.redAccent;
    } else if (type == 'SUBST') {
      eventBadgeIcon = Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: AppColor.info,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFF135B37), width: 1),
        ),
        child: const Icon(Icons.sync_alt_rounded, color: Colors.white, size: 9),
      );
      eventTitle = 'Substituição';
      titleColor = Colors.white70;
    } else if (type == 'VAR') {
      eventBadgeIcon = Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: Colors.purpleAccent,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFF135B37), width: 1),
        ),
        child: const Icon(Icons.tv_rounded, color: Colors.white, size: 9),
      );
      eventTitle = 'Decisão do VAR';
      titleColor = Colors.purpleAccent;
    }

    final avatarWidget = Stack(
      clipBehavior: Clip.none,
      children: [
        PlayerEventPhoto(photo: event.playerPhoto, size: 30),
        if (eventBadgeIcon != null)
          Positioned(
            left: isHome ? null : -4,
            right: isHome ? -4 : null,
            top: -4,
            child: eventBadgeIcon,
          ),
      ],
    );

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': playerName,
                },
              )
          : null,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF0F4A2C).withOpacity(0.5),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColor.info.withOpacity(0.2), width: 0.8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: isHome ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: isHome
              ? [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          eventTitle,
                          style: TextStyle(
                            color: titleColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          playerName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (type == 'SUBST' && assistName.isNotEmpty)
                          Text(
                            'Sai: $assistName',
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 9,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        else if (type == 'GOAL' && assistName.isNotEmpty)
                          Text(
                            'Assist: $assistName',
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 9,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        else if (event.detail != null && event.detail!.isNotEmpty && type != 'GOAL' && type != 'CARD')
                          Text(
                            event.detail!,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 9,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  const Gap(8),
                  avatarWidget,
                ]
              : [
                  avatarWidget,
                  const Gap(8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          eventTitle,
                          style: TextStyle(
                            color: titleColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          playerName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (type == 'SUBST' && assistName.isNotEmpty)
                          Text(
                            'Sai: $assistName',
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 9,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        else if (type == 'GOAL' && assistName.isNotEmpty)
                          Text(
                            'Assist: $assistName',
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 9,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        else if (event.detail != null && event.detail!.isNotEmpty && type != 'GOAL' && type != 'CARD')
                          Text(
                            event.detail!,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 9,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
        ),
      ),
    );
  }
}


///Substitute
class EventSubstituteRight extends StatelessWidget {
  const EventSubstituteRight({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': event.player ?? '',
                },
              )
          : null,
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(
                  "${event.time}'",
                  style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                ),
              ],
            ),
          ),
          Expanded(
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    SvgPicture.asset(
                      Assets.subIn,
                      width: 18,
                    ),
                    const Gap(5),
                    PlayerEventPhoto(photo: event.playerPhoto),
                    const Gap(5),
                    Flexible(
                      child: Text(
                        event.player ?? '',
                        maxLines: 1,
                        style:
                            context.textTheme.bodySmall!.copyWith(fontSize: 15),
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    SvgPicture.asset(
                      Assets.subOut,
                      width: 18,
                    ),
                    const Gap(5),
                    const PlayerEventPhoto(), 
                    const Gap(5),
                    Flexible(
                      child: Text(
                        event.assist ?? '',
                        maxLines: 1,
                        style:
                            context.textTheme.bodySmall!.copyWith(fontSize: 15),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class EventSubstituteLeft extends StatelessWidget {
  const EventSubstituteLeft({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': event.player ?? '',
                },
              )
          : null,
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(
                  "${event.time}'",
                  style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                ),
                const Gap(10),
                Expanded(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          SvgPicture.asset(
                            Assets.subIn,
                            width: 18,
                          ),
                          const Gap(5),
                          PlayerEventPhoto(photo: event.playerPhoto),
                          const Gap(5),
                          Flexible(
                            child: Text(
                              event.player ?? '',
                              maxLines: 1,
                              style: context.textTheme.bodySmall!
                                  .copyWith(fontSize: 15),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          SvgPicture.asset(
                            Assets.subOut,
                            width: 18,
                          ),
                          const Gap(5),
                          const PlayerEventPhoto(),
                          const Gap(5),
                          Flexible(
                            child: Text(
                              event.assist ?? '',
                              maxLines: 1,
                              style: context.textTheme.bodySmall!
                                  .copyWith(fontSize: 15),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Expanded(
            child: Align(
              alignment: Alignment.centerRight,
            ),
          ),
        ],
      ),
    );
  }
}

///Status Match

class EventMatchStatus extends StatelessWidget {
  const EventMatchStatus({super.key, required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          "$status'",
          style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
        ),
        Text(
          "1 - 1",
          style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
        ),
        const SizedBox(width: 30),
      ],
    );
  }
}

///Goals
class EventGoalLeft extends StatelessWidget {
  const EventGoalLeft({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': event.player ?? '',
                },
              )
          : null,
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(
                  "${event.time}'",
                  style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                ),
                const Gap(10),
                Expanded(
                  child: Row(
                    children: [
                      PlayerEventPhoto(photo: event.playerPhoto),
                      const Gap(5),
                      Flexible(
                        child: Text(
                          event.player ?? '',
                          maxLines: 1,
                          style:
                              context.textTheme.bodySmall!.copyWith(fontSize: 15),
                        ),
                      ),
                      const Gap(5),
                      SvgPicture.asset(
                        Assets.soccer,
                        width: 18,
                      ),
                    ],
                  ),
                ),
                if (event.detail != null)
                  Text(
                    event.detail!,
                    style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                  ),
              ],
            ),
          ),
          const Expanded(
            child: Align(
              alignment: Alignment.centerRight,
            ),
          ),
        ],
      ),
    );
  }
}

class EventGoalRight extends StatelessWidget {
  const EventGoalRight({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': event.player ?? '',
                },
              )
          : null,
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(
                  "${event.time}'",
                  style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                ),
                const Gap(10),
                const Expanded(
                  child: SizedBox.shrink(),
                ),
                if (event.detail != null)
                  Text(
                    event.detail!,
                    style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                  ),
              ],
            ),
          ),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                SvgPicture.asset(
                  Assets.soccer,
                  width: 18,
                ),
                const Gap(5),
                PlayerEventPhoto(photo: event.playerPhoto),
                const Gap(5),
                Flexible(
                  child: Text(
                    event.player ?? '',
                    maxLines: 1,
                    style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

///Cards Yellow or Red
class EventCardsLeft extends StatelessWidget {
  const EventCardsLeft({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    final isRed = event.detail?.toLowerCase().contains('red') ?? false;
    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': event.player ?? '',
                },
              )
          : null,
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(
                  "${event.time}'",
                  style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                ),
                const Gap(10),
                Expanded(
                  child: Row(
                    children: [
                      PlayerEventPhoto(photo: event.playerPhoto),
                      const Gap(5),
                      Expanded(
                        child: Text(
                          event.player ?? '',
                          maxLines: 1,
                          style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                        ),
                      ),
                    ],
                  ),
                ),
                SvgPicture.asset(
                  Assets.yellowCard,
                  width: 14,
                  color: isRed ? Colors.redAccent : null,
                ),
              ],
            ),
          ),
          const Expanded(child: SizedBox.shrink()),
        ],
      ),
    );
  }
}

class EventCardsRight extends StatelessWidget {
  const EventCardsRight({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    final isRed = event.detail?.toLowerCase().contains('red') ?? false;
    final pId = (event.externalPlayerId != null && event.externalPlayerId! > 0)
        ? event.externalPlayerId.toString()
        : (event.playerId != null && event.playerId! > 0)
            ? event.playerId.toString()
            : (event.playerPhoto != null && event.playerPhoto!.contains('/players/'))
                ? RegExp(r'/players/(\d+)\.png').firstMatch(event.playerPhoto!)?.group(1) ?? '0'
                : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': event.player ?? '',
                },
              )
          : null,
      child: Row(
        children: [
          Text(
            "${event.time}'",
            style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
          ),
          const Gap(10),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                SvgPicture.asset(
                  Assets.yellowCard,
                  width: 14,
                  color: isRed ? Colors.redAccent : null,
                ),
                const Gap(10),
                PlayerEventPhoto(photo: event.playerPhoto),
                const Gap(10),
                Flexible(
                  child: Text(
                    event.player ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CardEventPossession extends StatelessWidget {
  const CardEventPossession({super.key, required this.icon, required this.homeValue, required this.awayValue});
  final String icon;
  final String homeValue;
  final String awayValue;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
            color: Theme.of(context).cardColor.withOpacity(0.8),
            borderRadius: BorderRadius.circular(15),
        ),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 5),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Text(
              homeValue,
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium!.copyWith(fontSize: 18),
              ),
            ),
            SvgPicture.asset(icon),
            Text(
              awayValue,
              style: GoogleFonts.urbanist(
                textStyle: context.textTheme.bodyMedium!.copyWith(fontSize: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
