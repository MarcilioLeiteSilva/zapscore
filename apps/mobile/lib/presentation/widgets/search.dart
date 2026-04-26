part of 'widgets.dart';

class PageSearchFixture extends StatelessWidget {
  const PageSearchFixture({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 15),
      itemBuilder: (_, i) {
        return const CardSearchFixture();
      },
      itemCount: 5,
    );
  }
}

class CardSearchFixture extends StatelessWidget {
  const CardSearchFixture({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Today, 26 December',
            style: context.textTheme.bodySmall,
          ),
          const Gap(10),
          Container(
            decoration: BoxDecoration(
              color: AppColor.card,
              border: Border.all(color: AppColor.info, width: 1),
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.symmetric(vertical: 15),
            child: CardFixtureItem(
              showDivider: false,
            ),
          ),
        ],
      ),
    );
  }
}

class CardCheepTabSearch extends StatelessWidget {
  const CardCheepTabSearch(
      {super.key,
      required this.select,
      required this.label,
      required this.onTap});
  final bool select;
  final String label;
  final Function() onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: select ? AppColor.primary : null,
          border: select ? null : Border.all(color: AppColor.primary, width: 1),
          borderRadius: BorderRadius.circular(30),
        ),
        child: Center(
          child: Text(
            label,
            style: context.textTheme.bodySmall!.copyWith(
              color: select ? Colors.white : AppColor.primary,
              fontSize: 15,
            ),
          ),
        ),
      ),
    );
  }
}

//popular
class PagePopularSearch extends StatelessWidget {
  const PagePopularSearch({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
          child: Text(
            'Popular Search',
            style: context.textTheme.bodyMedium,
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            itemBuilder: (_, i) {
              return ListTile(
                onTap: () {},
                trailing: const Icon(
                  Icons.arrow_forward_ios,
                  size: 18,
                ),
                leading: const SizedBox(
                  width: 50,
                  height: 50,
                  child: CardNoImage(radius: 5),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                title: Row(
                  children: [
                    Flexible(
                      child: Text(
                        'Popular Search',
                        maxLines: 1,
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    //fav
                    ...[
                      const Gap(5),
                      SvgPicture.asset(
                        Assets.starSolid,
                        width: 13,
                      ),
                    ]
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class PageSearchCompetition extends StatelessWidget {
  const PageSearchCompetition({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchCubit, SearchState>(
      builder: (context, state) {
        if (state is SearchLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is SearchError) {
          return Center(child: Text(state.message));
        }
        if (state is SearchLoaded) {
          if (state.leagues.isEmpty) {
            return const Center(child: Text('No competitions found'));
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
            itemCount: state.leagues.length,
            itemBuilder: (_, i) {
              final league = state.leagues[i];
              return ListTile(
                onTap: () {
                  context.pushNamed(screenLeague, extra: league);
                },
                trailing: const Icon(
                  Icons.arrow_forward_ios,
                  size: 18,
                ),
                leading: SizedBox(
                  width: 50,
                  height: 50,
                  child: Image.network(
                    league.logo ?? '',
                    errorBuilder: (_, __, ___) => const CardNoImage(radius: 5),
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                title: Row(
                  children: [
                    Flexible(
                      child: Text(
                        league.name,
                        maxLines: 1,
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    const Gap(5),
                    BlocBuilder<FavoriteCubit, FavoriteState>(
                      builder: (context, favState) {
                        final isFav = context
                            .read<FavoriteCubit>()
                            .isLeagueFavorite(league.externalId.toString());
                        return Icon(
                          isFav ? Icons.star : Icons.star_border,
                          color: isFav ? Colors.amber : Colors.white,
                          size: 16,
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          );
        }
        return const Center(child: Text('Type to search competitions'));
      },
    );
  }
}

class PageSearchTeams extends StatelessWidget {
  const PageSearchTeams({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchCubit, SearchState>(
      builder: (context, state) {
        if (state is SearchLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is SearchError) {
          return Center(child: Text(state.message));
        }
        if (state is SearchLoaded) {
          if (state.teams.isEmpty) {
            return const Center(child: Text('No teams found'));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
            itemBuilder: (_, i) {
              final team = state.teams[i];
              return Container(
                padding: const EdgeInsets.symmetric(vertical: 5),
                decoration: BoxDecoration(
                  color: AppColor.card,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: CardFollowItem(
                  team: team,
                  onTap: () {
                    context.pushNamed(screenTeam, extra: team);
                  },
                ),
              );
            },
            separatorBuilder: (_, i) => const Gap(10),
            itemCount: state.teams.length,
          );
        }
        return const Center(child: Text('Type to search teams'));
      },
    );
  }
}

class PageSearchNews extends StatelessWidget {
  const PageSearchNews({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const ScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
      itemBuilder: (_, i) {
        return const CardNewsItem();
      },
      separatorBuilder: (_, i) => const Gap(15),
      itemCount: 10,
    );
  }
}

class PageSearchWatch extends StatelessWidget {
  const PageSearchWatch({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const ScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
      itemBuilder: (_, i) {
        return const CardNewsItem(isVideo: true);
      },
      separatorBuilder: (_, i) => const Gap(15),
      itemCount: 10,
    );
  }
}
