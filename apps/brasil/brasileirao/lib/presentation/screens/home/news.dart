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

  static const List<String> _serieAClubs = [
    'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'sao paulo',
    'santos', 'grêmio', 'gremio', 'internacional', 'inter',
    'botafogo', 'fluminense', 'vasco', 'vasco da gama', 'cruzeiro',
    'atlético-mg', 'atletico-mg', 'atlético mineiro', 'atletico mineiro', 'galo',
    'bahia', 'fortaleza', 'athletico-pr', 'athletico', 'cuiabá', 'cuiaba',
    'vitória', 'vitoria', 'juventude', 'criciúma', 'criciuma',
    'atlético-go', 'atletico-go', 'red bull bragantino', 'bragantino'
  ];

  static const List<String> _serieBClubs = [
    'chapecoense', 'sport recife', 'sport', 'coritiba', 'goiás', 'goias',
    'ceará', 'ceara', 'américa-mg', 'america-mg', 'américa mineiro', 'america mineiro',
    'avaí', 'avai', 'novorizontino', 'mirassol', 'vila nova', 'operário', 'operario',
    'crb', 'ponte preta', 'brusque', 'paysandu', 'guarani', 'amazonas', 'ituano',
    'botafogo-sp'
  ];

  static const List<String> _excludedKeywords = [
    'wsl', 'surf', 'trestles', 'fórmula 1', 'formula 1', 'motogp',
    'stf', 'reforma tributária', 'reforma tributaria', 'senado', 'eleições', 'eleicoes'
  ];

  bool _hasClub(String text, List<String> clubs) {
    for (final club in clubs) {
      if (club.length <= 4) {
        if (RegExp(r'\b' + RegExp.escape(club) + r'\b', caseSensitive: false).hasMatch(text)) {
          return true;
        }
      } else {
        if (text.contains(club)) {
          return true;
        }
      }
    }
    return false;
  }

  bool _isSerieANews(String text) {
    final hasExplicitSerieA = text.contains('brasileirão série a') ||
        text.contains('brasileirao serie a') ||
        text.contains('campeonato brasileiro série a') ||
        text.contains('campeonato brasileiro serie a');
    if (hasExplicitSerieA) return true;

    final hasGeneralComp = text.contains('brasileirão') ||
        text.contains('brasileirao') ||
        text.contains('campeonato brasileiro') ||
        text.contains('série a') ||
        text.contains('serie a');

    return hasGeneralComp && _hasClub(text, _serieAClubs);
  }

  bool _isSerieBNews(String text) {
    final hasExplicitSerieB = text.contains('brasileirão série b') ||
        text.contains('brasileirao serie b') ||
        text.contains('campeonato brasileiro série b') ||
        text.contains('campeonato brasileiro serie b');
    if (hasExplicitSerieB) return true;

    final hasGeneralComp = text.contains('brasileirão') ||
        text.contains('brasileirao') ||
        text.contains('campeonato brasileiro') ||
        text.contains('série b') ||
        text.contains('serie b');

    return hasGeneralComp && _hasClub(text, _serieBClubs);
  }

  bool _matchesFilter(News news) {
    final t = '${news.title} ${news.description}'.toLowerCase();

    // Filtro negativo contra ruídos externos (política, outros esportes)
    if (_excludedKeywords.any((kw) => t.contains(kw))) {
      return false;
    }

    if (indexTab == 0) {
      // Aba 'Todas': apenas matérias legítimas do Brasileirão (Série A ou Série B)
      return _isSerieANews(t) || _isSerieBNews(t);
    } else if (indexTab == 1) {
      // Aba 'Brasileirão Série A'
      return _isSerieANews(t);
    } else if (indexTab == 2) {
      // Aba 'Brasileirão Série B'
      return _isSerieBNews(t);
    } else if (indexTab == 3) {
      // Aba 'Mercado da Bola': transferências de clubes do Brasileirão
      final isBrazilianFootball = _isSerieANews(t) ||
          _isSerieBNews(t) ||
          _hasClub(t, _serieAClubs) ||
          _hasClub(t, _serieBClubs);
      if (!isBrazilianFootball) return false;

      final marketKeywords = [
        'mercado', 'transferência', 'transferencia', 'reforço', 'reforco',
        'contrata', 'contratação', 'contratacao', 'acerta', 'negocia',
        'fechou', 'assina', 'proposta', 'rescinde', 'anuncia'
      ];
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
