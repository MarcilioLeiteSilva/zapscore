part of 'widgets.dart';

class CardSlideLeagueHome extends StatelessWidget {
  const CardSlideLeagueHome({super.key, this.leagues = const []});
  final List<League> leagues;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      height: 42,
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Material(
        color: Colors.transparent,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          itemBuilder: (_, i) {
            return CheepLeagueItem(league: leagues[i]);
          },
          separatorBuilder: (_, i) => const Gap(10),
          itemCount: leagues.length,
        ),
      ),
    );
  }
}

class CheepLeagueItem extends StatelessWidget {
  const CheepLeagueItem({super.key, required this.league});
  final League league;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.pushNamed(screenLeague, extra: league),
      borderRadius: BorderRadius.circular(50),
      child: Ink(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor.withOpacity(0.5),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: league.logo != null
                  ? CachedNetworkImage(imageUrl: proxyImage(league.logo!), fit: BoxFit.contain)
                  : const CardNoImage(radius: 5),
            ),
            const Gap(10),
            Text(
              league.name,
              style: context.textTheme.bodySmall!.copyWith(
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CardCalendarHome extends StatelessWidget {
  const CardCalendarHome({super.key});

  @override
  Widget build(BuildContext context) {
    var now = DateTime.now();
    List<DateTime> dates = List.generate(
      7,
      (index) => DateTime(now.year, now.month, now.day - 3 + index),
    ).toList();

    return BlocBuilder<SettingCubit, SettingState>(
      builder: (context, state) {
        final selectedDate = state.selectedDate;

        return SizedBox(
          width: context.width,
          height: 60,
          child: Padding(
            padding: const EdgeInsets.only(left: 5),
            child: Row(
              children: [
                const CardLiveButton(),
                const Gap(4),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: dates
                        .map(
                          (model) => CardCalendarItem(
                            select: !state.isLiveSelected && model.day == selectedDate.day &&
                                selectedDate.month == model.month,
                            date: model,
                            onTap: () {
                              context
                                  .read<SettingCubit>()
                                  .updateCalendarDate(model);
                            },
                          ),
                        )
                        .toList(),
                  ),
                ),
                /* if (false)
                  Expanded(
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemBuilder: (_, i) {
                        var model = dates[i];

                        return CardCalendarItem(
                          select: model.day == selectedDate.day &&
                              selectedDate.month == model.month,
                          date: dates[i],
                          onTap: () {
                            context
                                .read<SettingCubit>()
                                .updateCalendarDate(model);
                          },
                        );
                      },
                      separatorBuilder: (_, i) => const Gap(5),
                      itemCount: dates.length,
                    ),
                  ),*/
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () {
                    context.read<SettingCubit>().visibleCalendar();
                  },
                  icon: SvgPicture.asset(
                    Assets.calendar,
                    height: 25,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class CardLiveButton extends StatelessWidget {
  const CardLiveButton({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LiveCubit, LiveState>(
      builder: (context, liveState) {
        return BlocBuilder<SettingCubit, SettingState>(
          builder: (context, settingState) {
            final isLive = liveState is LiveLoaded && liveState.fixtures.isNotEmpty;
            final isSelected = settingState.isLiveSelected;
            
            return InkWell(
              onTap: () {
                context.read<SettingCubit>().toggleLive();
                if (!isSelected) {
                  context.read<LiveCubit>().fetchLiveFixtures();
                }
              },
              borderRadius: BorderRadius.circular(30),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  color: isSelected ? Colors.red : (isLive ? Colors.red.withOpacity(0.15) : Theme.of(context).cardColor.withOpacity(0.3)),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 7,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isLive && !isSelected) ...[
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const Gap(5),
                    ],
                    Text(
                      'Live',
                      style: context.textTheme.bodySmall!.copyWith(
                        fontSize: 16,
                        color: isSelected ? Colors.white : (isLive ? Colors.red : Theme.of(context).primaryColor),
                        fontWeight: (isLive || isSelected) ? FontWeight.bold : null,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class CardCalendarItem extends StatelessWidget {
  const CardCalendarItem(
      {super.key,
      required this.date,
      required this.onTap,
      required this.select});
  final bool select;
  final DateTime date;
  final Function() onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: select ? Theme.of(context).primaryColor : null,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 5,
          vertical: 6,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              getMonthName(date, context.read<SettingCubit>().state.language),
              style: context.textTheme.bodySmall!.copyWith(
                fontSize: 10.5,
                color: select ? context.appColors.darkGreen : null,
              ),
            ),
            Text(
              '${date.day}',
              style: context.textTheme.bodyLarge!.copyWith(
                fontSize: 15,
                color: select ? context.appColors.darkGreen : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CardGroupFixtureItem extends StatelessWidget {
  const CardGroupFixtureItem({super.key, this.competition});
  final HomeCompetition? competition;

  @override
  Widget build(BuildContext context) {
    if (competition == null) {
      return const SizedBox();
    }
    final comp = competition!;
    return Ink(
      width: context.width,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor.withOpacity(0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        borderRadius: BorderRadius.circular(15),
      ),
      padding: const EdgeInsets.only(
        left: 15,
        top: 15,
        bottom: 10,
      ),
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(
                width: 40,
                height: 40,
                child: comp.league.logo != null
                    ? CachedNetworkImage(imageUrl: proxyImage(comp.league.logo!), fit: BoxFit.contain)
                    : const CardNoImage(radius: 10),
              ),
              const Gap(10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            comp.league.name.toUpperCase(),
                            maxLines: 1,
                            style: context.textTheme.bodySmall!.copyWith(
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (comp.league.country != null)
                      Text(
                        comp.league.country!,
                        style: context.textTheme.labelSmall,
                      ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  context.pushNamed(screenLeague, extra: comp.league);
                },
                icon: const Icon(
                  Icons.arrow_forward_ios,
                  size: 18,
                ),
              ),
            ],
          ),
          if (comp.matches.isNotEmpty)
            ...comp.matches
                .map((match) => CardFixtureItem(fixture: match))
                .toList()
          else
            const Padding(
              padding: EdgeInsets.only(top: 20, bottom: 20, right: 15),
              child: Text('Nenhum jogo disponível para esta data'),
            ),
        ],
      ),
    );
  }
}

class CardFixtureItem extends StatelessWidget {
  const CardFixtureItem({super.key, this.fixture, this.showDivider = true});
  final Fixture? fixture;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    if (fixture == null) {
      return const SizedBox(); // Or a placeholder
    }
    final fix = fixture!;
    return Column(
      children: [
        if (showDivider) ...[
          const Gap(5),
          const Divider(endIndent: 20),
          const Gap(5),
        ],
        InkWell(
          onTap: () {
            context.pushNamed(screenFixtureDetails, extra: fix);
          },
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (isLive(fix.statusShort))
                      const PulsingLiveIndicator(),
                    const Gap(5),
                    Text(
                      isLive(fix.statusShort)
                          ? '${fix.elapsed}\''
                          : getShortStatus(
                              fix.statusShort, fix.statusLong, context),
                      style: context.textTheme.bodySmall!.copyWith(
                        color: isLive(fix.statusShort)
                            ? Colors.red
                            : (fix.statusShort == 'FT' ? Colors.green : null),
                        fontWeight:
                            isLive(fix.statusShort) ? FontWeight.bold : null,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const Gap(10),
              Expanded(
                child: Column(
                  children: [
                    InkWell(
                      onTap: () {
                        if (fix.homeTeam != null) {
                          context.pushNamed(
                            screenTeam, 
                            extra: fix.homeTeam,
                            queryParameters: {'leagueId': fix.league?.externalId.toString() ?? ''},
                          );
                        }
                      },
                      child: Row(
                        children: [
                          SizedBox(
                            width: 40,
                            height: 40,
                            child: fix.homeTeam?.logo != null
                                ? CachedNetworkImage(imageUrl: proxyImage(fix.homeTeam!.logo!),
                                    fit: BoxFit.contain)
                                : const CardNoImage(radius: 10),
                          ),
                          const Gap(10),
                          Flexible(
                            child: Text(
                              fix.homeTeam?.name ?? 'Home',
                              style: context.textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Gap(10),
                    InkWell(
                      onTap: () {
                        if (fix.awayTeam != null) {
                          context.pushNamed(
                            screenTeam, 
                            extra: fix.awayTeam,
                            queryParameters: {'leagueId': fix.league?.externalId.toString() ?? ''},
                          );
                        }
                      },
                      child: Row(
                        children: [
                          SizedBox(
                            width: 40,
                            height: 40,
                            child: fix.awayTeam?.logo != null
                                ? CachedNetworkImage(imageUrl: proxyImage(fix.awayTeam!.logo!),
                                    fit: BoxFit.contain)
                                : const CardNoImage(radius: 10),
                          ),
                          const Gap(10),
                          Flexible(
                            child: Text(
                              fix.awayTeam?.name ?? 'Away',
                              style: context.textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Text(
                      '${fix.homeGoals ?? 0}',
                      style: context.textTheme.bodyLarge!.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: isLive(fix.statusShort) ? AppColor.primary : null,
                      ),
                    ),
                    const Gap(8),
                    Text(
                      '${fix.awayGoals ?? 0}',
                      style: context.textTheme.bodyLarge!.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: isLive(fix.statusShort) ? AppColor.primary : null,
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                child: BlocBuilder<FavoriteCubit, FavoriteState>(
                  builder: (context, favState) {
                    final isFav = context
                        .read<FavoriteCubit>()
                        .isFixtureFavorite(fix.id);
                    return LikeButton(
                      size: 20,
                      isLiked: isFav,
                      onTap: (val) async {
                        context.read<FavoriteCubit>().toggleFixture(fix.id);
                        return !val;
                      },
                      circleColor: const CircleColor(
                        start: Colors.orange,
                        end: Colors.deepOrange,
                      ),
                      bubblesColor: const BubblesColor(
                        dotPrimaryColor: Colors.orange,
                        dotSecondaryColor: Colors.deepOrange,
                      ),
                      likeBuilder: (bool isLiked) {
                        return SvgPicture.asset(
                          isLiked ? Assets.starSolid : Assets.star,
                          color: isLiked ? Colors.amber : Colors.white,
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class CardGoalsBarRight extends StatelessWidget {
  const CardGoalsBarRight({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SvgPicture.asset(Assets.soccer),
        const Gap(5),
        Text(
          'Magalhas',
          style: context.textTheme.bodySmall!.copyWith(
            fontSize: 15,
          ),
        ),
        const Gap(5),
        Text(
          "63'",
          style: context.textTheme.bodySmall!.copyWith(
            fontSize: 15,
            color: Colors.white60,
          ),
        ),
      ],
    );
  }
}

class CardGoalsBarLeft extends StatelessWidget {
  const CardGoalsBarLeft({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          "63'",
          style: context.textTheme.bodySmall!.copyWith(
            fontSize: 15,
            color: Colors.white60,
          ),
        ),
        const Gap(5),
        Text(
          'Magalhas',
          style: context.textTheme.bodySmall!.copyWith(
            fontSize: 15,
          ),
        ),
        const Gap(5),
        SvgPicture.asset(Assets.soccer),
      ],
    );
  }
}

class CardBasicInfo extends StatelessWidget {
  const CardBasicInfo({super.key, this.fixture});
  final Fixture? fixture;

  @override
  Widget build(BuildContext context) {
    if (fixture == null) return const SizedBox();

    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 15,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Theme.of(context).cardColor.withOpacity(0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CardInfoTileItem(
            icon: Assets.calendarLine,
            label: DateFormat('dd MMM yyyy, HH:mm', context.read<SettingCubit>().state.language).format(fixture!.date),
          ),
          if (fixture!.venueName != null) ...[
            const Gap(15),
            CardInfoTileItem(
              icon: Assets.mapPinLine,
              label: fixture!.venueName!,
            ),
          ],
          if (fixture!.venueCity != null) ...[
            const Gap(15),
            CardInfoTileItem(
              icon: Assets.mapPinLine,
              label: fixture!.venueCity!,
            ),
          ],
          if (fixture!.round != null) ...[
            const Gap(15),
            CardInfoTileItem(
              icon: Assets.userLine,
              label: fixture!.round!,
            ),
          ],
        ],
      ),
    );
  }
}

class CardInfoTileItem extends StatelessWidget {
  const CardInfoTileItem({super.key, required this.label, required this.icon});
  final String label, icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SvgPicture.asset(
          icon,
          width: 18,
        ),
        const Gap(10),
        Expanded(
          child: Text(
            label,
            style: context.textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

class CardFixtureDetail extends StatelessWidget {
  const CardFixtureDetail({super.key, this.fixture});
  final Fixture? fixture;

  @override
  Widget build(BuildContext context) {
    if (fixture == null) {
      return const SizedBox();
    }
    final fix = fixture!;
    return Container(
      width: context.width,
      constraints: BoxConstraints(
        minHeight: context.height * .3,
      ),
      margin: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: context.appColors.darkGreen,
        borderRadius: BorderRadius.circular(15),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [          Column(
            children: [
              Text(
                fix.league?.name ?? 'Competition',
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.textTheme.headlineSmall,
              ),
              if (fix.league?.country != null)
                Text(
                  fix.league!.country!,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 15,
                  ),
                ),
            ],
          ),
          const Gap(15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Expanded(
                child: InkWell(
                  onTap: () {
                    if (fix.homeTeam != null) {
                      context.pushNamed(
                        screenTeam, 
                        extra: fix.homeTeam,
                        queryParameters: {'leagueId': fix.league?.externalId.toString() ?? ''},
                      );
                    }
                  },
                  child: Column(
                    children: [
                      SizedBox(
                        width: 70,
                        height: 70,
                        child: fix.homeTeam?.logo != null
                            ? CachedNetworkImage(imageUrl: proxyImage(fix.homeTeam!.logo!),
                                fit: BoxFit.contain)
                            : const CardNoImage(radius: 5),
                      ),
                      const Gap(5),
                      Text(
                        fix.homeTeam?.name ?? 'Home',
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  children: [
                    Text(
                      '${fix.homeGoals ?? 0} : ${fix.awayGoals ?? 0}',
                      style: context.textTheme.headlineMedium!.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 45,
                      ),
                    ),
                    const Gap(5),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (isLive(fix.statusShort)) ...[
                          const PulsingLiveIndicator(),
                          const Gap(8),
                        ],
                        Text(
                          isLive(fix.statusShort)
                              ? '${fix.elapsed}\''
                              : getShortStatus(
                                  fix.statusShort, fix.statusLong, context),
                          style: context.textTheme.bodySmall!.copyWith(
                            fontSize: 16,
                            fontWeight:
                                isLive(fix.statusShort) ? FontWeight.bold : null,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () {
                    if (fix.awayTeam != null) {
                      context.pushNamed(
                        screenTeam, 
                        extra: fix.awayTeam,
                        queryParameters: {'leagueId': fix.league?.externalId.toString() ?? ''},
                      );
                    }
                  },
                  child: Column(
                    children: [
                      SizedBox(
                        width: 70,
                        height: 70,
                        child: fix.awayTeam?.logo != null
                            ? CachedNetworkImage(imageUrl: proxyImage(fix.awayTeam!.logo!),
                                fit: BoxFit.contain)
                            : const CardNoImage(radius: 5),
                      ),
                      const Gap(5),
                      Text(
                        fix.awayTeam?.name ?? 'Away',
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const Gap(15),
          // Simplified events view for now
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Expanded(
                child: Column(
                  children: [
                    // CardGoalsBarLeft(),
                  ],
                ),
              ),
              Gap(10),
              Expanded(
                child: Column(
                  children: [
                    // CardGoalsBarRight(),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class CardFormInfoFixture extends StatelessWidget {
  const CardFormInfoFixture({
    super.key,
    required this.homeTeamName,
    required this.awayTeamName,
    this.homeForm,
    this.awayForm,
  });

  final String homeTeamName, awayTeamName;
  final String? homeForm, awayForm;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Theme.of(context).cardColor.withOpacity(0.7),
      ),
      child: Column(
        children: [
          _buildFormRow(context, homeTeamName, homeForm),
          const Divider(height: 30, indent: 10, endIndent: 10),
          _buildFormRow(context, awayTeamName, awayForm),
        ],
      ),
    );
  }

  Widget _buildFormRow(BuildContext context, String teamName, String? form) {
    List<String> forms = form?.split('').reversed.take(5).toList().reversed.toList() ?? [];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              teamName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.textTheme.bodySmall!.copyWith(
                fontSize: 15,
              ),
            ),
          ),
          const Gap(10),
          if (forms.isEmpty)
             const Text('N/A', style: TextStyle(fontSize: 12, color: Colors.white54))
          else
            for (var f in forms)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: CircleAvatar(
                  radius: 10,
                  backgroundColor: _getFormColor(f),
                  child: Text(
                    f,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
        ],
      ),
    );
  }

  Color _getFormColor(String form) {
    switch (form.toUpperCase()) {
      case 'W':
        return Colors.green;
      case 'L':
        return Colors.red;
      case 'D':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }
}

class CardFormMatch extends StatelessWidget {
  const CardFormMatch({super.key, required this.fixture});
  final Fixture fixture;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.pushNamed(
        screenFixtureDetails,
        extra: fixture,
      ),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor.withOpacity(0.5),
          borderRadius: BorderRadius.circular(30),
        ),
        padding: const EdgeInsets.symmetric(
          vertical: 8,
          horizontal: 14,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: fixture.homeTeam?.logo != null
                  ? CachedNetworkImage(imageUrl: proxyImage(fixture.homeTeam!.logo!), fit: BoxFit.contain)
                  : const CardNoImage(radius: 5),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                '${fixture.homeGoals ?? 0}-${fixture.awayGoals ?? 0}',
                style: context.textTheme.bodySmall!.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
            SizedBox(
              width: 22,
              height: 22,
              child: fixture.awayTeam?.logo != null
                  ? CachedNetworkImage(imageUrl: proxyImage(fixture.awayTeam!.logo!), fit: BoxFit.contain)
                  : const CardNoImage(radius: 5),
            ),
          ],
        ),
      ),
    );
  }
}

class PulsingLiveIndicator extends StatefulWidget {
  const PulsingLiveIndicator({super.key});

  @override
  State<PulsingLiveIndicator> createState() => _PulsingLiveIndicatorState();
}

class _PulsingLiveIndicatorState extends State<PulsingLiveIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.2, end: 1.0).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: 6,
        height: 6,
        decoration: const BoxDecoration(
          color: Colors.red,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.red,
              blurRadius: 4,
              spreadRadius: 1,
            ),
          ],
        ),
      ),
    );
  }
}
