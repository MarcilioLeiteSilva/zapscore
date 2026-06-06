part of 'widgets.dart';

class PageSearchFixture extends StatelessWidget {
  const PageSearchFixture({super.key});

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
          if (state.fixtures.isEmpty) {
            return const Center(child: Text('No matches found'));
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 15),
            itemCount: state.fixtures.length,
            itemBuilder: (_, i) {
              return CardSearchFixture(fixture: state.fixtures[i]);
            },
          );
        }
        return const Center(child: Text('Type to search matches'));
      },
    );
  }
}

class CardSearchFixture extends StatelessWidget {
  const CardSearchFixture({super.key, required this.fixture});
  final Fixture fixture;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor.withOpacity(0.8),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(vertical: 15),
            child: CardFixtureItem(
              fixture: fixture,
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
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: select ? Theme.of(context).primaryColor : Theme.of(context).cardColor.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20), // Reduzido de 30 para 20
        ),
        child: Center(
          child: Text(
            label,
            style: context.textTheme.bodySmall!.copyWith(
              color: select 
                ? context.appColors.darkGreen
                : Theme.of(context).primaryColor,
              fontSize: 12, // Reduzido de 15 para 12
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
    return BlocBuilder<SearchCubit, SearchState>(
      builder: (context, state) {
        if (state is SearchLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is SearchLoaded) {
          final items = [
            ...state.leagues.take(3),
            ...state.teams.take(3),
          ];

          if (items.isEmpty) {
            return const Center(child: Text('No popular results found'));
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
                child: Text(
                  'Top Results',
                  style: context.textTheme.bodyMedium,
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemCount: items.length,
                  itemBuilder: (_, i) {
                    final item = items[i];
                    if (item is League) {
                      return ListTile(
                        onTap: () => context.pushNamed(screenLeague, extra: item),
                        leading: SizedBox(
                          width: 40,
                          height: 40,
                          child: CachedNetworkImage(imageUrl: proxyImage(item.logo ?? ''), errorWidget: (_, __, ___) => const CardNoImage(radius: 5)),
                        ),
                        title: Text(item.name),
                        subtitle: const Text('Competition'),
                        trailing: BlocBuilder<FavoriteCubit, FavoriteState>(
                          builder: (context, favState) {
                            final isFav = context.read<FavoriteCubit>().isLeagueFavorite(item.externalId.toString());
                            return Icon(isFav ? Icons.star : Icons.star_border, color: isFav ? Colors.amber : Colors.white, size: 18);
                          },
                        ),
                      );
                    } else if (item is Team) {
                      return CardFollowItem(
                        team: item,
                        onTap: () => context.pushNamed(screenTeam, extra: item),
                      );
                    }
                    return const SizedBox();
                  },
                ),
              ),
            ],
          );
        }
        return const Center(child: Text('Type to search'));
      },
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
                  child: CachedNetworkImage(imageUrl: proxyImage(league.logo ?? ''),
                    errorWidget: (_, __, ___) => const CardNoImage(radius: 5),
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
                        return LikeButton(
                          size: 16,
                          isLiked: isFav,
                          onTap: (val) async {
                            context
                                .read<FavoriteCubit>()
                                .toggleLeague(league.externalId.toString());
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
                            return Icon(
                              isLiked ? Icons.star : Icons.star_border,
                              color: isLiked ? Colors.amber : Colors.white,
                              size: 16,
                            );
                          },
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
                  color: Theme.of(context).cardColor,
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
    return BlocBuilder<NewsCubit, NewsState>(
      builder: (context, state) {
        if (state is NewsLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is NewsLoaded) {
          final newsList = state.news;
          if (newsList.isEmpty) {
            return const Center(child: Text('No news found'));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
            itemBuilder: (_, i) {
              return CardNewsItem(news: newsList[i]);
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: newsList.length,
          );
        }
        return const Center(child: Text('Failed to load news'));
      },
    );
  }
}

class PageSearchWatch extends StatelessWidget {
  const PageSearchWatch({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<VideoCubit, VideoState>(
      builder: (context, state) {
        if (state is VideoLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is VideoLoaded) {
          final videoList = state.videos;
          if (videoList.isEmpty) {
            return const Center(child: Text('No videos found'));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
            itemBuilder: (_, i) {
              return CardNewsItem(
                isVideo: true,
                video: videoList[i],
              );
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: videoList.length,
          );
        }
        return const Center(child: Text('Failed to load videos'));
      },
    );
  }
}
