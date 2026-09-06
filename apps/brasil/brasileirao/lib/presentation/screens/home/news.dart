part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;

  final List<Map<String, String?>> _categories = [
    {'name': 'Todas', 'leagueId': '71', 'type': 'all'},
    {'name': 'Brasileirão Série A', 'leagueId': '71', 'type': 'league'},
    {'name': 'Brasileirão Série B', 'leagueId': '72', 'type': 'league'},
    {'name': 'Mercado da Bola', 'leagueId': '71', 'type': 'mercado'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNews();
    });
  }

  void _loadNews() {
    final cat = _categories[indexTab];
    final targetLeagueId = cat['leagueId'] ?? '71';
    context.read<NewsCubit>().fetchNews(leagueId: targetLeagueId, limit: 100);
  }

  bool _matchesFilter(News news) {
    if (indexTab == 3) {
      final marketKeywords = [
        'mercado', 'transferência', 'transferencia', 'reforço', 'reforco',
        'contrata', 'contratação', 'contratacao', 'acerta', 'negocia',
        'fechou', 'assina', 'proposta', 'rescinde', 'anuncia'
      ];
      final t = '${news.title} ${news.description}'.toLowerCase();
      return marketKeywords.any((kw) => t.contains(kw));
    }
    return true;
  }

  Widget _buildCompetitionFilters() {
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
            final cat = _categories[i];
            final isSelected = indexTab == i;
            return CardCheepTabSearch(
              select: isSelected,
              label: cat['name']!,
              onTap: () {
                if (indexTab == i) return;
                setState(() {
                  indexTab = i;
                });
                _loadNews();
              },
            );
          },
          separatorBuilder: (_, i) => const Gap(10),
          itemCount: _categories.length,
        ),
      ),
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
              return const Center(child: CircularProgressIndicator());
            }
            if (state is NewsError) {
              return Center(child: Text(state.message));
            }
            if (state is NewsLoaded) {
              final filteredNews = state.news.where(_matchesFilter).toList();
              final carouselNews = filteredNews.take(5).toList();
              final listNews = filteredNews.skip(5).toList();

              final displayList = listNews.isNotEmpty ? listNews : carouselNews;
              final itemCount = displayList.length;

              return CustomScrollView(
                slivers: [
                  // Filter bar
                  SliverToBoxAdapter(child: _buildCompetitionFilters()),

                  if (filteredNews.isEmpty)
                    const SliverToBoxAdapter(
                      child: SizedBox(
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
                      ),
                    )
                  else ...[
                    // Top spacing
                    const SliverToBoxAdapter(child: Gap(10)),

                    // Carousel (top 5)
                    if (carouselNews.isNotEmpty)
                      SliverToBoxAdapter(
                        child: SizedBox(
                          width: context.width,
                          height: context.height * .35,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            itemBuilder: (_, i) => CardNewsCarouselItem(news: carouselNews[i]),
                            separatorBuilder: (_, i) => const Gap(10),
                            itemCount: carouselNews.length,
                          ),
                        ),
                      ),

                    // Trending title
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(10, 20, 10, 20),
                        child: Text(
                          'trending_news'.tr(context),
                          style: context.textTheme.bodyMedium,
                        ),
                      ),
                    ),

                    // News list — lazy: only visible items are built
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) {
                            final item = displayList[i];
                            final showAd = i > 0 && i % 6 == 0;
                            return Padding(
                              padding: EdgeInsets.only(bottom: i < itemCount - 1 ? 15 : 0),
                              child: showAd
                                  ? Column(
                                      children: [
                                        const AppNativeAdWidget(variant: NativeAdVariant.newsOrVideo),
                                        const Gap(15),
                                        CardNewsItem(news: item),
                                      ],
                                    )
                                  : CardNewsItem(news: item),
                            );
                          },
                          childCount: itemCount,
                        ),
                      ),
                    ),
                  ],

                  // Bottom spacing
                  const SliverToBoxAdapter(child: Gap(80)),
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
