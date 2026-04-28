part of 'widgets.dart';

class MatchLeaguePage extends StatelessWidget {
  const MatchLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            itemBuilder: (_, i) {
              final fix = state.fixtures[i];
              return CardFixtureLeagueItem(fixture: fix);
            },
            separatorBuilder: (_, i) => const Gap(10),
            itemCount: state.fixtures.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

class CardMatchLeague extends StatelessWidget {
  const CardMatchLeague({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          DateFormat('EEEE, d MMMM').format(DateTime.now()),
          style: context.textTheme.bodySmall,
        ),
        const Gap(15),
        ListView.separated(
          shrinkWrap: true,
          physics: const ScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            vertical: 10,
            horizontal: 10,
          ),
          itemBuilder: (_, i) {
            return Ink(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor.withOpacity(0.8),
                borderRadius: BorderRadius.circular(15),
              ),
              child: const CardFollowItem(),
            );
          },
          separatorBuilder: (_, i) => const Gap(15),
          itemCount: 3,
        ),
      ],
    );
  }
}

class OverviewPage extends StatelessWidget {
  const OverviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            children: [
              const Gap(10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Jogos Recentes',
                    style: context.textTheme.bodySmall,
                  ),
                ],
              ),
              const Gap(5),
              ListView.separated(
                shrinkWrap: true,
                physics: const ScrollPhysics(),
                padding: EdgeInsets.zero,
                itemBuilder: (_, i) {
                  final fix = state.fixtures[i];
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
                      border: Border(
                        bottom: BorderSide(
                          color: context.appColors.info ?? Colors.transparent,
                          width: 1,
                        ),
                      ),
                    ),
                    padding: const EdgeInsets.only(
                      left: 15,
                      top: 15,
                      bottom: 10,
                    ),
                    child: CardFixtureItem(
                      fixture: fix,
                      showDivider: false,
                    ),
                  );
                },
                separatorBuilder: (_, i) => const Gap(10),
                itemCount: state.fixtures.length > 3 ? 3 : state.fixtures.length,
              ),
              const Gap(20),
              Text(
                'Melhores Marcadores',
                style: context.textTheme.bodySmall,
              ),
              const Gap(20),
              Container(
                width: context.width,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(15),
                ),
                padding:
                    const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const ScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemBuilder: (_, i) {
                    final scorer = state.scorers[i];
                    return CardTopScores(scorer: scorer, rank: i + 1);
                  },
                  separatorBuilder: (_, i) => const Divider(height: 30),
                  itemCount: state.scorers.length > 5 ? 5 : state.scorers.length,
                ),
              ),
              const Gap(50),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class CardTopScores extends StatelessWidget {
  const CardTopScores({super.key, this.scorer, required this.rank});
  final Scorer? scorer;
  final int rank;

  @override
  Widget build(BuildContext context) {
    if (scorer == null) return const SizedBox();
    final item = scorer!;
    return InkWell(
      onTap: item.externalPlayerId != null
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': item.externalPlayerId.toString(),
                  'name': item.playerName,
                },
              )
          : null,
      child: Row(
        children: [
          SizedBox(
            width: 25,
            child: Text(
              '$rank',
              style: context.textTheme.bodySmall!.copyWith(
                fontWeight: FontWeight.bold,
                color: rank <= 3 ? Theme.of(context).primaryColor : null,
              ),
            ),
          ),
          const Gap(5),
          SizedBox(
            width: 40,
            height: 40,
            child: item.playerPhoto != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.network(item.playerPhoto!, fit: BoxFit.cover),
                  )
                : CircleAvatar(
                    backgroundColor: context.appColors.info,
                    child: const Icon(Icons.person, color: Colors.white54),
                  ),
          ),
          const Gap(10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.playerName,
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    if (item.teamLogo != null) ...[
                      Image.network(item.teamLogo!, width: 14, height: 14),
                      const Gap(5),
                    ],
                    Expanded(
                      child: Text(
                        item.teamName,
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Colors.white54,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            '${item.goals} Gols',
            style: context.textTheme.bodySmall!.copyWith(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class TableLeaguePage extends StatelessWidget {
  const TableLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
            children: [
              Container(
                width: context.width,
                padding: const EdgeInsets.symmetric(
                  horizontal: 15,
                  vertical: 15,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  color: Theme.of(context).cardColor.withOpacity(0.8),
                ),
                child: Table(
                  columnWidths: const {
                    0: FlexColumnWidth(1),
                    1: FlexColumnWidth(4),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(1),
                    4: FlexColumnWidth(1),
                    5: FlexColumnWidth(1),
                    6: FlexColumnWidth(1),
                    7: FlexColumnWidth(1.2),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: context.appColors.info ?? Colors.transparent,
                            width: 1,
                          ),
                        ),
                      ),
                      children: [
                        TableTileItem(
                          '#',
                          padding: EdgeInsets.only(bottom: 15),
                          isCrossCenter: true,
                        ),
                        TableTileItem(
                          'TIME',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'P',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'J',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'V',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'E',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'D',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'SG',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                      ],
                    ),
                    for (final standing in state.standings)
                      TableRow(
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: context.appColors.info ?? Colors.transparent,
                              width: 1,
                            ),
                          ),
                        ),
                        children: [
                          TableTileItem(
                            '${standing.rank}',
                            isTop: [1, 2, 3, 4].contains(standing.rank),
                            isCrossCenter: true,
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 25,
                                  height: 25,
                                  child: standing.teamLogo != null
                                      ? Image.network(standing.teamLogo!,
                                          fit: BoxFit.contain)
                                      : const CardNoImage(radius: 5),
                                ),
                                const Gap(8),
                                Expanded(
                                  child: Text(
                                    standing.teamName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TableTileItem('${standing.points}'),
                          TableTileItem('${standing.played}'),
                          TableTileItem('${standing.win}'),
                          TableTileItem('${standing.draw}'),
                          TableTileItem('${standing.lose}'),
                          TableTileItem('${standing.goalsDiff}'),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class TableTileItem extends StatelessWidget {
  const TableTileItem(
    this.text, {
    super.key,
    this.padding,
    this.isTop = false,
    this.isCrossCenter = false,
  });
  final String text;
  final EdgeInsetsGeometry? padding;
  final bool isTop;
  final bool isCrossCenter;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? EdgeInsets.symmetric(vertical: isTop ? 10 : 15),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: isCrossCenter
            ? CrossAxisAlignment.center
            : CrossAxisAlignment.start,
        children: [
          Text(text, style: const TextStyle(fontSize: 15)),
          if (isTop) ...[
            const Gap(3),
            Container(
              width: 28,
              height: 5,
              decoration: const BoxDecoration(
                  color: AppColor.primary,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(4),
                    topRight: Radius.circular(4),
                  )),
            ),
          ]
        ],
      ),
    );
  }
}

class NewsLeaguePage extends StatelessWidget {
  const NewsLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NewsCubit, NewsState>(
      builder: (context, state) {
        if (state is NewsLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is NewsError) {
          return Center(child: Text(state.message));
        }
        if (state is NewsLoaded) {
          if (state.news.isEmpty) {
            return const Center(child: Text('Nenhuma notícia para esta competição'));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            itemBuilder: (_, i) {
              return CardNewsItem(news: state.news[i]);
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: state.news.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

class RoundLeaguePage extends StatelessWidget {
  const RoundLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          final cubit = context.read<LeagueCubit>();
          final roundFixtures = state.fixtures
              .where((f) => f.round == state.selectedRound)
              .toList();

          return Column(
            children: [
              Container(
                padding: const EdgeInsets.all(15),
                decoration: const BoxDecoration(),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      onPressed: cubit.prevRound,
                      icon: const Icon(Icons.arrow_back_ios, size: 20),
                    ),
                    Expanded(
                      child: Text(
                        state.selectedRound,
                        textAlign: TextAlign.center,
                        style: context.textTheme.bodySmall!.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: cubit.nextRound,
                      icon: const Icon(Icons.arrow_forward_ios, size: 20),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.separated(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  itemBuilder: (_, i) {
                    final fix = roundFixtures[i];
                    return CardFixtureLeagueItem(fixture: fix);
                  },
                  separatorBuilder: (_, i) => const Gap(10),
                  itemCount: roundFixtures.length,
                ),
              ),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class CardFixtureLeagueItem extends StatelessWidget {
  final Fixture fixture;
  const CardFixtureLeagueItem({super.key, required this.fixture});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(fixture.date);
    return Ink(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor.withOpacity(0.8),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 15, top: 10, right: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  fixture.round ?? '',
                  style: context.textTheme.labelSmall!.copyWith(
                    color: Colors.white54,
                  ),
                ),
                Text(
                  dateStr,
                  style: context.textTheme.labelSmall!.copyWith(
                    color: Colors.white54,
                  ),
                ),
              ],
            ),
          ),
          CardFixtureItem(
            fixture: fixture,
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class TopScoreLeaguePage extends StatelessWidget {
  const TopScoreLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const TopScoresList();
  }
}

class TopScoresList extends StatelessWidget {
  const TopScoresList({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          return ListView.separated(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
            itemBuilder: (_, i) {
              final scorer = state.scorers[i];
              return Ink(
                width: context.width,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(15),
                ),
                padding:
                    const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
                child: CardTopScores(scorer: scorer, rank: i + 1),
              );
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: state.scorers.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

class TopScoreAllPage extends StatelessWidget {
  const TopScoreAllPage({super.key, required this.onTap});
  final Function(int) onTap;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 10),
      children: [
        CardTopScoreItem(
          label: 'GOALS',
          onAll: () {
            onTap(0);
          },
        ),
        const Gap(20),
        CardTopScoreItem(
          label: 'ASSITS',
          onAll: () {
            onTap(1);
          },
        ),
        const Gap(20),
        CardTopScoreItem(
          label: 'YELLOW CARDS',
          onAll: () {
            onTap(2);
          },
        ),
        const Gap(20),
        CardTopScoreItem(
          label: 'RED CARDS',
          onAll: () {
            onTap(3);
          },
        ),
      ],
    );
  }
}

class CardTopScoreItem extends StatelessWidget {
  const CardTopScoreItem({super.key, required this.label, required this.onAll});
  final String label;
  final Function() onAll;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        return Ink(
          width: context.width,
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor.withOpacity(0.8),
            borderRadius: BorderRadius.circular(15),
          ),
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: context.textTheme.bodySmall,
              ),
              const Divider(height: 30),
              if (state is LeagueLoaded && label == 'GOALS')
                ListView.separated(
                  shrinkWrap: true,
                  physics: const ScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemBuilder: (_, i) {
                    final scorer = state.scorers[i];
                    return CardTopScores(scorer: scorer, rank: i + 1);
                  },
                  separatorBuilder: (_, i) => const Divider(height: 30),
                  itemCount: state.scorers.length > 5 ? 5 : state.scorers.length,
                )
              else
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text('Nenhum dado disponível'),
                  ),
                ),
              const Divider(height: 30),
              Center(
                child: InkWell(
                  onTap: onAll,
                  child: Text(
                    'Ver Tudo',
                    style: context.textTheme.bodySmall!.copyWith(
                      color: Theme.of(context).primaryColor,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
