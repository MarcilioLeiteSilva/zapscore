part of 'widgets.dart';

class CardSlideLeagueHome extends StatelessWidget {
  const CardSlideLeagueHome({super.key, this.leagues = const []});
  final List<League> leagues;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      height: 42,
      color: AppColor.background,
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
          borderRadius: BorderRadius.circular(50),
          border: Border.all(
            color: AppColor.primary,
            width: 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: league.logo != null
                  ? Image.network(league.logo!, fit: BoxFit.contain)
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
            padding: const EdgeInsets.only(left: 10),
            child: Row(
              children: [
                const CardLiveButton(),
                const Gap(8),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: dates
                        .map(
                          (model) => CardCalendarItem(
                            select: model.day == selectedDate.day &&
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
                  onPressed: () {
                    context.read<SettingCubit>().visibleCalendar();
                  },
                  icon: SvgPicture.asset(
                    Assets.calendar,
                    height: 25,
                    color: AppColor.primary,
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
      builder: (context, state) {
        final isLive = state is LiveLoaded && state.fixtures.isNotEmpty;
        
        return InkWell(
          onTap: () => context.pushNamed(screenLive),
          borderRadius: BorderRadius.circular(30),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(30),
              color: isLive ? Colors.red.withOpacity(0.1) : null,
              border: Border.all(
                color: isLive ? Colors.red : AppColor.primary,
                width: 1,
              ),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: 11,
              vertical: 7,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isLive) ...[
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
                    color: isLive ? Colors.red : AppColor.primary,
                    fontWeight: isLive ? FontWeight.bold : null,
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
          color: select ? AppColor.primary : null,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: 8,
          vertical: 6,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              getMonthName(date),
              style: context.textTheme.bodySmall!.copyWith(
                fontSize: 11,
              ),
            ),
            Text(
              '${date.day}',
              style: context.textTheme.bodyLarge!.copyWith(
                fontSize: 15,
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
        color: AppColor.card,
        border: Border.all(
          color: AppColor.info,
          width: 1,
        ),
        borderRadius: BorderRadius.circular(10),
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
                    ? Image.network(comp.league.logo!, fit: BoxFit.contain)
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
                      isLive(fix.statusShort) ? '${fix.elapsed}\'' : (fix.statusShort ?? 'TBD'),
                      style: context.textTheme.bodySmall!.copyWith(
                        color: isLive(fix.statusShort) ? Colors.red : (fix.statusShort == 'FT' ? Colors.green : null),
                        fontWeight: isLive(fix.statusShort) ? FontWeight.bold : null,
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
                          context.pushNamed(screenTeam, extra: fix.homeTeam);
                        }
                      },
                      child: Row(
                        children: [
                          SizedBox(
                            width: 40,
                            height: 40,
                            child: fix.homeTeam?.logo != null
                                ? Image.network(fix.homeTeam!.logo!,
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
                          context.pushNamed(screenTeam, extra: fix.awayTeam);
                        }
                      },
                      child: Row(
                        children: [
                          SizedBox(
                            width: 40,
                            height: 40,
                            child: fix.awayTeam?.logo != null
                                ? Image.network(fix.awayTeam!.logo!,
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
                  color: AppColor.background.withOpacity(0.5),
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
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        runSpacing: 15,
        children: [
          CardInfoTileItem(
            icon: Assets.calendarLine,
            label: DateFormat('dd MMM yyyy, HH:mm').format(fixture!.date),
          ),
          if (fixture!.venueName != null)
            CardInfoTileItem(
              icon: Assets.mapPinLine,
              label: fixture!.venueName!,
            ),
          if (fixture!.venueCity != null)
            CardInfoTileItem(
              icon: Assets.mapPinLine,
              label: fixture!.venueCity!,
            ),
          if (fixture!.round != null)
            CardInfoTileItem(
              icon: Assets.userLine,
              label: fixture!.round!,
            ),
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
      mainAxisSize: MainAxisSize.min,
      children: [
        SvgPicture.asset(
          icon,
          width: 18,
        ),
        const Gap(10),
        Text(
          label,
          style: context.textTheme.bodySmall,
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
        color: AppColor.primary,
        borderRadius: BorderRadius.circular(15),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [          Column(
            children: [
              Text(
                fix.league?.name ?? 'Competition',
                style: context.textTheme.headlineSmall,
              ),
              if (fix.league?.country != null)
                Text(
                  fix.league!.country!,
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
              InkWell(
                onTap: () {
                  if (fix.homeTeam != null) {
                    context.pushNamed(screenTeam, extra: fix.homeTeam);
                  }
                },
                child: Column(
                  children: [
                    SizedBox(
                      width: 70,
                      height: 70,
                      child: fix.homeTeam?.logo != null
                          ? Image.network(fix.homeTeam!.logo!, fit: BoxFit.contain)
                          : const CardNoImage(radius: 5),
                    ),
                    const Gap(5),
                    Text(
                      fix.homeTeam?.name ?? 'Home',
                      style: context.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Column(
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
                        isLive(fix.statusShort) ? '${fix.elapsed}\'' : (fix.statusLong ?? 'TBD'),
                        style: context.textTheme.bodySmall!.copyWith(
                          fontSize: 16,
                          fontWeight: isLive(fix.statusShort) ? FontWeight.bold : null,
                          color: isLive(fix.statusShort) ? Colors.white : Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              InkWell(
                onTap: () {
                  if (fix.awayTeam != null) {
                    context.pushNamed(screenTeam, extra: fix.awayTeam);
                  }
                },
                child: Column(
                  children: [
                    SizedBox(
                      width: 70,
                      height: 70,
                      child: fix.awayTeam?.logo != null
                          ? Image.network(fix.awayTeam!.logo!, fit: BoxFit.contain)
                          : const CardNoImage(radius: 5),
                    ),
                    const Gap(5),
                    Text(
                      fix.awayTeam?.name ?? 'Away',
                      style: context.textTheme.bodySmall,
                    ),
                  ],
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
  const CardFormInfoFixture({super.key});

  @override
  Widget build(BuildContext context) {
    List<String> forms = ['L', 'L', 'L', 'W', 'L'];
    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                Text(
                  'Chelsea',
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                for (var form in forms)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: CircleAvatar(
                      radius: 10,
                      backgroundColor: form == 'L' ? Colors.red : Colors.green,
                      child: Text(
                        form,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Gap(15),
          SizedBox(
            width: context.width,
            height: 45,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              itemBuilder: (_, i) {
                return const CardFormMatch();
              },
              separatorBuilder: (_, i) => const Gap(10),
            ),
          ),
          const Divider(
            height: 50,
            endIndent: 15,
            indent: 15,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                Text(
                  'Arsenal',
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                for (var form in forms)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: CircleAvatar(
                      radius: 10,
                      backgroundColor: form == 'L' ? Colors.red : Colors.green,
                      child: Text(
                        form,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Gap(15),
          SizedBox(
            width: context.width,
            height: 45,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              itemBuilder: (_, i) {
                return const CardFormMatch();
              },
              separatorBuilder: (_, i) => const Gap(10),
            ),
          ),
        ],
      ),
    );
  }
}

class CardFormMatch extends StatelessWidget {
  const CardFormMatch({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColor.info, width: 1),
        borderRadius: BorderRadius.circular(30),
      ),
      padding: const EdgeInsets.symmetric(
        vertical: 8,
        horizontal: 18,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 25,
            height: 25,
            child: CardNoImage(radius: 5),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              '1-0',
              style: context.textTheme.bodySmall,
            ),
          ),
          const SizedBox(
            width: 25,
            height: 25,
            child: CardNoImage(radius: 5),
          ),
        ],
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
