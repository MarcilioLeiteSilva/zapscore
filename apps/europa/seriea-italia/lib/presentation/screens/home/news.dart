part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;
  String? selectedFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NewsCubit>().fetchNews(leagueId: AppConfig.leagueId, limit: 100);
    });
  }

  bool _isBrazilNews(News news) {
    final text = '${news.title} ${news.description ?? ''} ${news.source ?? ''}'.toLowerCase();
    return text.contains('brasileirão') ||
        text.contains('brasileirao') ||
        text.contains('série a do brasil') ||
        text.contains('serie a do brasil') ||
        text.contains('flamengo') ||
        text.contains('palmeiras') ||
        text.contains('corinthians') ||
        text.contains('são paulo fc') ||
        text.contains('santos fc') ||
        text.contains('botafogo') ||
        text.contains('fluminense') ||
        text.contains('cruzeiro') ||
        text.contains('atletico-mg') ||
        text.contains('atletico mineiro') ||
        text.contains('bahia') ||
        text.contains('bragantino');
  }

  bool _matchesFilter(News news, String? filter) {
    if (_isBrazilNews(news)) return false;
    if (filter == null || filter.isEmpty || filter == 'Serie A' || filter == 'Serie A - Itália') return true;
    final f = filter.toLowerCase();
    return news.title.toLowerCase().contains(f) ||
        news.description.toLowerCase().contains(f) ||
        (news.source != null && news.source!.toLowerCase().contains(f));
  }

  List<Map<String, String?>> _generateDynamicCategories(List<News> allNews, HomeState homeState) {
    final List<Map<String, String?>> categories = [
      {'name': 'Serie A - Itália', 'filter': null},
    ];

    final Set<String> candidates = {};

    if (homeState is HomeLoaded) {
      for (var comp in homeState.competitions) {
        for (var m in comp.matches) {
          if (m.homeTeam?.name != null) candidates.add(m.homeTeam!.name);
          if (m.awayTeam?.name != null) candidates.add(m.awayTeam!.name);
        }
      }
    }

    for (var n in allNews) {
      if (n.source != null && n.source!.isNotEmpty) {
        candidates.add(n.source!);
      }
    }

    final Set<String> addedNames = {'Serie A', 'Serie A - Itália'};
    for (var cand in candidates) {
      if (addedNames.contains(cand)) continue;
      final hasMatch = allNews.any((n) => _matchesFilter(n, cand));
      if (hasMatch) {
        addedNames.add(cand);
        categories.add({'name': cand, 'filter': cand});
      }
    }

    return categories;
  }

  Widget _buildCompetitionFilters(List<News> allNews) {
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (context, homeState) {
        final categories = _generateDynamicCategories(allNews, homeState);

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
                      selectedFilter = cat['filter'];
                    });
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
              color: Theme.of(context).colorScheme.onSurface,
              height: 25,
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<NewsCubit>().fetchNews(leagueId: AppConfig.leagueId, limit: 100),
        child: BlocBuilder<NewsCubit, NewsState>(
          builder: (context, state) {
            if (state is NewsLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is NewsError) {
              return Center(child: Text(state.message));
            }
            if (state is NewsLoaded) {
              final filteredNews = state.news.where((n) => _matchesFilter(n, selectedFilter)).toList();
              final carouselNews = filteredNews.take(5).toList();
              final listNews = filteredNews.skip(5).toList();

              return ListView(
                children: [
                  _buildCompetitionFilters(state.news),
                  if (filteredNews.isEmpty)
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
                        final item = listNews.isNotEmpty ? listNews[i] : carouselNews[i];
                        if (i > 0 && i % 3 == 0) {
                          return Column(
                            children: [
                              const AdBannerWidget(),
                              const Gap(15),
                              CardNewsItem(news: item),
                            ],
                          );
                        }
                        return CardNewsItem(news: item);
                      },
                      separatorBuilder: (_, i) => const Gap(15),
                      itemCount: listNews.isNotEmpty ? listNews.length : carouselNews.length,
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
    );
  }
}
