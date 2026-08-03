part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;
  String? selectedLeagueId = '78';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NewsCubit>().fetchNews(leagueId: selectedLeagueId, limit: 100);
    });
  }

  Widget _buildCompetitionFilters() {
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (context, homeState) {
        final List<Map<String, String?>> categories = [
          {'name': 'Bundesliga', 'leagueId': '78', 'teamId': null},
          {'name': 'Bayern München', 'leagueId': '78', 'teamId': '157'},
          {'name': 'Borussia Dortmund', 'leagueId': '78', 'teamId': '165'},
          {'name': 'Bayer Leverkusen', 'leagueId': '78', 'teamId': '168'},
          {'name': 'RB Leipzig', 'leagueId': '78', 'teamId': '173'},
          {'name': 'Eintracht Frankfurt', 'leagueId': '78', 'teamId': '169'},
          {'name': 'VfB Stuttgart', 'leagueId': '78', 'teamId': '172'},
          {'name': 'VfL Wolfsburg', 'leagueId': '78', 'teamId': '161'},
        ];

        if (homeState is HomeLoaded) {
          final setIds = categories.map((c) => c['teamId']).toSet();
          for (var comp in homeState.competitions) {
            for (var m in comp.matches) {
              if (m.homeTeam != null && m.homeTeam!.id != null && !setIds.contains(m.homeTeam!.id)) {
                setIds.add(m.homeTeam!.id);
                categories.add({'name': m.homeTeam!.name, 'leagueId': '78', 'teamId': m.homeTeam!.id});
              }
              if (m.awayTeam != null && m.awayTeam!.id != null && !setIds.contains(m.awayTeam!.id)) {
                setIds.add(m.awayTeam!.id);
                categories.add({'name': m.awayTeam!.name, 'leagueId': '78', 'teamId': m.awayTeam!.id});
              }
            }
          }
        }

        return Container(
          width: context.width,
          height: 45,
          color: Theme.of(context).scaffoldBackgroundColor,
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Material(
            color: Colors.transparent,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemBuilder: (_, i) {
                final cat = categories[i];
                final isSelected = indexTab == i;
                return CardCheepTabSearch(
                  select: isSelected,
                  label: cat['name']!,
                  onTap: () {
                    setState(() {
                      indexTab = i;
                      selectedLeagueId = cat['leagueId'];
                    });
                    context.read<NewsCubit>().fetchNews(
                      leagueId: cat['leagueId'],
                      teamId: cat['teamId'],
                      limit: 100,
                    );
                  },
                );
              },
              separatorBuilder: (_, i) => const Gap(10),
              itemCount: categories.length,
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: AppDrawer(),
      appBar: AppBar(
        title: Text("news".tr(context)),
        centerTitle: true,
        flexibleSpace: buildBlurFlexibleSpace(),
        actions: [
          IconButton(
            onPressed: () => context.pushNamed(screenSearch),
            icon: SvgPicture.asset(
              Assets.searchLine,
              color: Colors.black,
              height: 25,
            ),
          ),
        ],
      ),
      body: BlocListener<HomeCubit, HomeState>(
        listener: (context, state) {
          if (selectedLeagueId == null) {
            setState(() {
              selectedLeagueId = '78';
              indexTab = 0;
            });
            context.read<NewsCubit>().fetchNews(leagueId: '78', limit: 100);
          }
        },
        child: RefreshIndicator(
          onRefresh: () => context.read<NewsCubit>().fetchNews(leagueId: selectedLeagueId, limit: 100),
          child: BlocBuilder<NewsCubit, NewsState>(
            builder: (context, state) {
              if (state is NewsLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state is NewsError) {
                return Center(child: Text(state.message));
              }
              if (state is NewsLoaded) {
                final carouselNews = state.news.take(5).toList();
                final listNews = state.news.skip(5).toList();
  
                return ListView(
                  children: [
                    _buildCompetitionFilters(),
                    if (state.news.isEmpty)
                      const SizedBox(
                        height: 300,
                        child: Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Text(
                              'Nenhuma notícia encontrada para o filtro selecionado',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white70, fontSize: 14),
                            ),
                          ),
                        ),
                      )
                    else ...[
                      const Gap(10),
                      if (carouselNews.isNotEmpty)
                        SizedBox(
                          width: context.width,
                          height: context.height * .35,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            itemBuilder: (_, i) {
                              return CardNewsCarouselItem(news: carouselNews[i]);
                            },
                            separatorBuilder: (_, i) => const Gap(10),
                            itemCount: carouselNews.length,
                          ),
                        ),
                      const Gap(20),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'trending_news'.tr(context),
                          style: context.textTheme.bodyMedium,
                        ),
                      ),
                      const Gap(20),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const ScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        itemBuilder: (_, i) {
                          return CardNewsItem(news: listNews[i]);
                        },
                        separatorBuilder: (_, i) => const Gap(15),
                        itemCount: listNews.length,
                      ),
                    ],
                    const Gap(80),
                  ],
                );
              }
              return const SizedBox();
            },
          ),
        ),
      ),
    );
  }
}
