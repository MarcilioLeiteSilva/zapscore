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
  const CardIndicatorThreeH2H({super.key, this.hideMid = false});
  final bool hideMid;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Container(
            height: 15,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
            ),
          ),
        ),
        if (!hideMid) ...[
          const Gap(10),
          Expanded(
            child: Container(
              height: 15,
              decoration: BoxDecoration(
                color: context.appColors.info,
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          ),
        ],
        const Gap(10),
        Expanded(
          flex: 2,
          child: Container(
            height: 15,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(15),
            ),
          ),
        ),
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
  const CardEventMatch({super.key, this.events = const [], required this.homeTeamId, required this.awayTeamId});
  final List<FixtureEvent> events;
  final int homeTeamId;
  final int awayTeamId;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return Container(
        width: context.width,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: Theme.of(context).cardColor,
          border: Border.all(color: context.appColors.info ?? Colors.transparent, width: 1),
        ),
        child: const Center(child: Text('Nenhum evento registrado')),
      );
    }

    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 15,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Theme.of(context).cardColor,
        border: Border.all(color: context.appColors.info ?? Colors.transparent, width: 1),
      ),
      child: Column(
        children: [
          for (var i = 0; i < events.length; i++) ...[
            _buildEventRow(context, events[i]),
            if (i < events.length - 1) const Divider(height: 25),
          ],
        ],
      ),
    );
  }

  Widget _buildEventRow(BuildContext context, FixtureEvent event) {
    final isHome = event.teamId == homeTeamId;

    switch (event.type.toLowerCase()) {
      case 'goal':
        return isHome
            ? EventGoalLeft(event: event)
            : EventGoalRight(event: event);
      case 'card':
        return isHome
            ? EventCardsLeft(event: event)
            : EventCardsRight(event: event);
      case 'subst':
        return isHome
            ? EventSubstituteLeft(event: event)
            : EventSubstituteRight(event: event);
      default:
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("${event.time}'", style: context.textTheme.bodySmall),
            Text("${event.type}: ${event.player}", style: context.textTheme.bodySmall),
            const SizedBox(width: 20),
          ],
        );
    }
  }
}

///Substitute
class EventSubstituteRight extends StatelessWidget {
  const EventSubstituteRight({super.key, required this.event});
  final FixtureEvent event;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: event.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': event.externalPlayerId.toString(),
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
    return InkWell(
      onTap: event.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': event.externalPlayerId.toString(),
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
    return InkWell(
      onTap: event.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': event.externalPlayerId.toString(),
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
    return InkWell(
      onTap: event.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': event.externalPlayerId.toString(),
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
    return InkWell(
      onTap: event.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': event.externalPlayerId.toString(),
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
    return InkWell(
      onTap: event.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': event.externalPlayerId.toString(),
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
              style: context.textTheme.bodyMedium!.copyWith(fontSize: 18),
            ),
            SvgPicture.asset(icon),
            Text(
              awayValue,
              style: context.textTheme.bodyMedium!.copyWith(fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }
}
