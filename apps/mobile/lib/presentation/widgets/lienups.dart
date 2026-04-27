part of 'widgets.dart';

class CardSubstitutionPlayers extends StatelessWidget {
  const CardSubstitutionPlayers({super.key, required this.substitutes});
  final List<FixtureLineup> substitutes;

  @override
  Widget build(BuildContext context) {
    if (substitutes.isEmpty) return const SizedBox();

    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SUBSTITUTOS',
            style: context.textTheme.bodySmall,
          ),
          const Divider(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 6,
            ),
            itemCount: substitutes.length,
            itemBuilder: (_, i) {
              return PlayerSubstitutionPlayerItem(player: substitutes[i]);
            },
          ),
        ],
      ),
    );
  }
}

class CardSubstitution extends StatelessWidget {
  const CardSubstitution({super.key, required this.substEvents, required this.homeTeamId});
  final List<FixtureEvent> substEvents;
  final int homeTeamId;

  @override
  Widget build(BuildContext context) {
    if (substEvents.isEmpty) return const SizedBox();

    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SUBSTITUIÇÕES',
            style: context.textTheme.bodySmall,
          ),
          const Divider(height: 20),
          GridView.builder(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const ScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 4,
            ),
            itemCount: substEvents.length,
            itemBuilder: (_, i) {
              return PlayerSubstitutionItem(event: substEvents[i]);
            },
          ),
        ],
      ),
    );
  }
}

class PlayerSubstitutionItem extends StatelessWidget {
  const PlayerSubstitutionItem({super.key, required this.event});
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
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            "${event.time}'",
            style: context.textTheme.bodySmall!.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Gap(10),
          if (event.playerPhoto != null)
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColor.info, width: 1),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(event.playerPhoto!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        const Icon(Icons.person, size: 16)),
              ),
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    SvgPicture.asset(
                      Assets.subOut,
                      width: 12,
                    ),
                    const Gap(5),
                    Flexible(
                      child: Text(
                        event.player ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodySmall!.copyWith(
                          fontSize: 11,
                          color: Colors.redAccent,
                        ),
                      ),
                    ),
                  ],
                ),
                const Gap(2),
                Row(
                  children: [
                    SvgPicture.asset(
                      Assets.subIn,
                      width: 12,
                    ),
                    const Gap(5),
                    Flexible(
                      child: Text(
                        event.assist ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodySmall!.copyWith(
                          fontSize: 11,
                          color: Colors.greenAccent,
                        ),
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

class PlayerSubstitutionPlayerItem extends StatelessWidget {
  const PlayerSubstitutionPlayerItem({super.key, required this.player});
  final FixtureLineup player;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: player.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': player.externalPlayerId.toString(),
                  'name': player.player,
                },
              )
          : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 35,
                height: 35,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColor.info, width: 1),
                  color: AppColor.cardDark,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: player.playerPhoto != null
                      ? Image.network(
                          player.playerPhoto!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(Icons.person, color: Colors.white54, size: 18),
                        )
                      : const Icon(Icons.person, color: Colors.white54, size: 18),
                ),
              ),
              Positioned(
                right: -2,
                bottom: -2,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.black87,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    "${player.number ?? ''}",
                    style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const Gap(10),
          Expanded(
            child: Text(
              player.player,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.textTheme.bodySmall!.copyWith(
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CardLineup extends StatelessWidget {
  const CardLineup({super.key, required this.fixture});
  final Fixture fixture;

  @override
  Widget build(BuildContext context) {
    final homeLineup = fixture.lineups.where((l) => l.teamId == fixture.homeTeam?.externalId && l.isStart).toList();
    final awayLineup = fixture.lineups.where((l) => l.teamId == fixture.awayTeam?.externalId && l.isStart).toList();

    if (homeLineup.isEmpty || awayLineup.isEmpty) {
      return Container(
        width: context.width,
        height: 200,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: AppColor.card,
          border: Border.all(color: AppColor.info, width: 1),
        ),
        child: const Center(child: Text('Escalações ainda não disponíveis')),
      );
    }

    return SizedBox(
      width: context.width,
      height: context.height * .75,
      child: Stack(
        children: [
          Positioned.fill(
            child: SvgPicture.asset(Assets.terrain, fit: BoxFit.fill),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Column(
              children: [
                const Gap(10),
                Text(
                  fixture.homeTeam?.name ?? '',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                Expanded(
                  child: _buildTeamLineup(context, homeLineup, isAway: false),
                ),
                Expanded(
                  child: _buildTeamLineup(context, awayLineup, isAway: true),
                ),
                Text(
                  fixture.awayTeam?.name ?? '',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                const Gap(10),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamLineup(BuildContext context, List<FixtureLineup> lineup, {required bool isAway}) {
    // Group by grid row (e.g. 1:1 -> row 1)
    Map<int, List<FixtureLineup>> rows = {};
    for (var player in lineup) {
      final gridParts = player.grid?.split(':');
      if (gridParts != null && gridParts.length == 2) {
        final row = int.tryParse(gridParts[0]) ?? 0;
        if (!rows.containsKey(row)) rows[row] = [];
        rows[row]!.add(player);
      }
    }

    final sortedRowKeys = rows.keys.toList()..sort();
    final displayRows = isAway ? sortedRowKeys.reversed.toList() : sortedRowKeys;

    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: displayRows.map((rowKey) {
        final playersInRow = rows[rowKey]!;
        // Sort players within row by column (gridParts[1])
        playersInRow.sort((a, b) {
          final colA = int.tryParse(a.grid?.split(':')[1] ?? '0') ?? 0;
          final colB = int.tryParse(b.grid?.split(':')[1] ?? '0') ?? 0;
          return colA.compareTo(colB);
        });

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: playersInRow.map((p) => PlayerLineupItem(
            player: p,
            isWhite: isAway,
            events: fixture.events.where((e) => e.playerId == p.externalPlayerId).toList(),
          )).toList(),
        );
      }).toList(),
    );
  }
}

class PlayerLineupItem extends StatelessWidget {
  const PlayerLineupItem({
    super.key,
    required this.player,
    this.isWhite = false,
    this.events = const [],
  });
  
  final FixtureLineup player;
  final bool isWhite;
  final List<FixtureEvent> events;

  @override
  Widget build(BuildContext context) {
    final hasYellow = events.any((e) => e.type.toLowerCase() == 'card' && e.detail?.toLowerCase().contains('yellow') == true);
    final hasRed = events.any((e) => e.type.toLowerCase() == 'card' && e.detail?.toLowerCase().contains('red') == true);
    final hasGoal = events.any((e) => e.type.toLowerCase() == 'goal');

    return GestureDetector(
      onTap: player.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': player.externalPlayerId.toString(),
                  'name': player.player,
                },
              )
          : null,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isWhite ? Colors.white : AppColor.primary,
                    width: 2,
                  ),
                  color: AppColor.cardDark,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: player.playerPhoto != null
                      ? Image.network(
                          player.playerPhoto!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildPlaceholder(),
                        )
                      : _buildPlaceholder(),
                ),
              ),
              Positioned(
                right: -5,
                top: -5,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '${player.number ?? ''}',
                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              if (hasYellow || hasRed)
                Positioned(
                  right: -8,
                  bottom: 10,
                  child: SvgPicture.asset(
                    Assets.yellowCard,
                    width: 10,
                    color: hasRed ? Colors.redAccent : null,
                  ),
                ),
              if (hasGoal)
                Positioned(
                  left: -8,
                  bottom: 10,
                  child: SvgPicture.asset(
                    Assets.soccer,
                    width: 12,
                  ),
                ),
            ],
          ),
          const Gap(4),
          SizedBox(
            width: 60,
            child: Text(
              player.player.split(' ').last,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, shadows: [
                Shadow(color: Colors.black, blurRadius: 2, offset: Offset(1, 1))
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return const CircleAvatar(
      backgroundColor: AppColor.info,
      child: Icon(Icons.person, color: Colors.white54, size: 20),
    );
  }
}

