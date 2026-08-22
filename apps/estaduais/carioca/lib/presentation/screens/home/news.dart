part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;
  String? selectedFilter;
  String _selectedLeagueId = AppConfig.cariocaSerieAId.toString();

  final List<Map<String, dynamic>> _leagues = [
    {'id': AppConfig.cariocaSerieAId.toString(), 'name': 'Série A'},
    {'id': AppConfig.cariocaSerieA2Id.toString(), 'name': 'Série A2'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNews();
    });
  }

  void _loadNews() {
    context.read<NewsCubit>().fetchNews(leagueId: _selectedLeagueId, limit: 100);
  }

  bool _matchesFilter(News news, String? filter) {
    if (filter == null || filter.isEmpty || filter == AppConfig.appName) return true;
    final f = filter.toLowerCase();
    return news.title.toLowerCase().contains(f) ||
        news.description.toLowerCase().contains(f) ||
        (news.source != null && news.source!.toLowerCase().contains(f));
  }

  List<Map<String, String?>> _generateDynamicCategories(List<News> allNews, HomeState homeState) {
    final String leagueLabel = _selectedLeagueId == AppConfig.cariocaSerieAId.toString() ? 'Série A' : 'Série A2';
    final List<Map<String, String?>> categories = [
      {'name': 'Todas ($leagueLabel)', 'filter': null},
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

    for (var cand in candidates) {
      final hasMatch = allNews.any((n) => _matchesFilter(n, cand));
      if (hasMatch) {
        categories.add({'name': cand, 'filter': cand});
      }
    }

    return categories;
  }

  Widget _buildLeagueSelector() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: _leagues.map((item) {
          final String id = item['id'];
          final String name = item['name'];
          final bool isSelected = _selectedLeagueId == id;
          return Expanded(
            child: InkWell(
              onTap: () {
                if (_selectedLeagueId == id) return;
                setState(() {
                  _selectedLeagueId = id;
                  indexTab = 0;
                  selectedFilter = null;
                });
                _loadNews();
              },
              borderRadius: BorderRadius.circular(8),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 7),
                decoration: BoxDecoration(
                  color: isSelected ? context.appColors.darkGreen : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  name,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? Colors.white : Colors.white60,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCompetitionFilters(List<News> allNews) {
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (context, homeState) {
        final categories = _generateDynamicCategories(allNews, homeState);

        return Container(
          width: context.width,
          height: 45,
          color: Theme.of(context).scaffoldBackgroundColor,
          padding: const EdgeInsets.symmetric(vertical: 6),
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
        onRefresh: () async => _loadNews(),
        child: BlocBuilder<NewsCubit, NewsState>(
          builder: (context, state) {
            if (state is NewsLoading) {
              return Column(
                children: [
                  _buildLeagueSelector(),
                  const Expanded(child: Center(child: CircularProgressIndicator())),
                ],
              );
            }
            if (state is NewsError) {
              return Column(
                children: [
                  _buildLeagueSelector(),
                  Expanded(child: Center(child: Text(state.message))),
                ],
              );
            }
            if (state is NewsLoaded) {
              final filteredNews = state.news.where((n) => _matchesFilter(n, selectedFilter)).toList();
              final carouselNews = filteredNews.take(5).toList();
              final listNews = filteredNews.skip(5).toList();

              return ListView(
                children: [
                  _buildLeagueSelector(),
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
                        if (i == 3) {
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
