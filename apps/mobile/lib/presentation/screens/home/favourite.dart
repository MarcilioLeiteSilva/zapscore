part of '../screens.dart';

class FavoritePage extends StatefulWidget {
  const FavoritePage({super.key});

  @override
  State<FavoritePage> createState() => _FavoritePageState();
}

class _FavoritePageState extends State<FavoritePage> {
  int indexTab = 0;
  List<String> listTab = ["Matches", "Competitions", "Teams"];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      body: NestedScrollView(
        headerSliverBuilder: (_, i) {
          return [
            SliverAppBar(
              title: const Text('Favorites'),
              centerTitle: false,
              pinned: true,
              actions: [
                IconButton(
                  onPressed: () => context.pushNamed(screenSearch),
                  icon: SvgPicture.asset(
                    Assets.searchLine,
                    color: Colors.white,
                    height: 25,
                  ),
                ),
                IconButton(
                  onPressed: () {},
                  icon: SvgPicture.asset(
                    Assets.bell,
                    color: Colors.white,
                    height: 24,
                  ),
                ),
              ],
              bottom: PreferredSize(
                preferredSize: Size(context.width, 48),
                child: Container(
                  width: context.width,
                  height: 48,
                  color: AppColor.background,
                  child: Material(
                    color: Colors.transparent,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      itemBuilder: (_, i) {
                        return CardCheepTabSearch(
                          select: indexTab == i,
                          label: listTab[i],
                          onTap: () {
                            setState(() {
                              indexTab = i;
                            });
                          },
                        );
                      },
                      separatorBuilder: (_, i) => const Gap(10),
                      itemCount: 3,
                    ),
                  ),
                ),
              ),
            ),
          ];
        },
        body: BlocBuilder<FavoriteCubit, FavoriteState>(
          builder: (context, state) {
            if (state is FavoriteLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is FavoriteLoaded) {
              return Column(
                children: [
                  const Gap(10),
                  Expanded(
                    child: [
                      // Tab Matches
                      state.favoriteFixtures.isEmpty
                          ? const Center(child: Text('No favorite matches yet'))
                          : ListView.separated(
                              padding: const EdgeInsets.only(
                                left: 10,
                                right: 10,
                                bottom: 120,
                              ),
                              itemBuilder: (_, i) {
                                final fixture = state.favoriteFixtures[i];
                                // We need a way to group fixtures by competition if we want the same UI
                                // For now, let's just show them as cards
                                return CardFixtureItem(
                                    fixture: fixture, showDivider: true);
                              },
                              separatorBuilder: (_, i) => const Gap(20),
                              itemCount: state.favoriteFixtures.length,
                            ),
                      // Tab Competitions
                      state.favoriteLeagues.isEmpty
                          ? const Center(
                              child: Text('No favorite competitions yet'))
                          : ListView.separated(
                              padding: const EdgeInsets.only(
                                left: 10,
                                right: 10,
                                top: 10,
                                bottom: 120,
                              ),
                              itemBuilder: (_, i) {
                                final league = state.favoriteLeagues[i];
                                return Ink(
                                  decoration: BoxDecoration(
                                    color: AppColor.card,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                        color: AppColor.info, width: 1),
                                  ),
                                  child: ListTile(
                                    leading: Image.network(
                                      league.logo ?? '',
                                      width: 40,
                                      errorBuilder: (_, __, ___) =>
                                          const Icon(Icons.emoji_events),
                                    ),
                                    title: Text(league.name),
                                    subtitle: Text(league.type ?? ''),
                                    trailing: const Icon(Icons.chevron_right),
                                    onTap: () {
                                      context.pushNamed(screenLeague,
                                          extra: league);
                                    },
                                  ),
                                );
                              },
                              separatorBuilder: (_, i) => const Gap(15),
                              itemCount: state.favoriteLeagues.length,
                            ),
                      // Tab Teams
                      state.favoriteTeams.isEmpty
                          ? const Center(child: Text('No favorite teams yet'))
                          : ListView.separated(
                              padding: const EdgeInsets.only(
                                left: 10,
                                right: 10,
                                top: 10,
                                bottom: 120,
                              ),
                              itemBuilder: (_, i) {
                                final team = state.favoriteTeams[i];
                                return Ink(
                                  decoration: BoxDecoration(
                                    color: AppColor.card,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                        color: AppColor.info, width: 1),
                                  ),
                                  child: ListTile(
                                    leading: Image.network(
                                      team.logo ?? '',
                                      width: 40,
                                      errorBuilder: (_, __, ___) =>
                                          const Icon(Icons.shield),
                                    ),
                                    title: Text(team.name),
                                    subtitle: Text(team.country ?? ''),
                                    trailing: const Icon(Icons.chevron_right),
                                    onTap: () {
                                      context.pushNamed(screenTeam, extra: team);
                                    },
                                  ),
                                );
                              },
                              separatorBuilder: (_, i) => const Gap(15),
                              itemCount: state.favoriteTeams.length,
                            ),
                    ][indexTab],
                  ),
                ],
              );
            }

            if (state is FavoriteError) {
              return Center(child: Text(state.message));
            }

            return const Center(child: Text('No favorites yet'));
          },
        ),
      ),
    );
  }
}
