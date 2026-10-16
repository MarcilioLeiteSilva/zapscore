part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;

  final List<Map<String, String?>> _categories = [
    {'name': 'Todas', 'type': 'all'},
    {'name': 'Carioca Série A', 'type': 'a1'},
    {'name': 'Carioca Série A2', 'type': 'a2'},
    {'name': 'Mercado da Bola', 'type': 'mercado'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNews();
    });
  }

  void _loadNews() {
    context.read<NewsCubit>().fetchNews(leagueId: AppConfig.leagueId, limit: 100);
  }

  static const List<String> _cariocaA1Clubs = [
    'flamengo', 'mengão', 'mengao', 'rubro-negro', 'rubro negro',
    'fluminense', 'flu', 'tricolor das laranjeiras',
    'vasco', 'vasco da gama', 'gigante da colina', 'cruzmaltino',
    'botafogo', 'fogão', 'fogao', 'alvinegro',
    'nova iguaçu', 'nova iguacu', 'orgulho da baixada',
    'portuguesa-rj', 'portuguesa carioca', 'lusa carioca',
    'madureira', 'madura', 'tricolor suburbano',
    'boavista', 'boavista-rj',
    'volta redonda', 'voltaço', 'voltaco',
    'bangu', 'alvirrubro da zona oeste',
    'sampaio corrêa-rj', 'sampaio correa-rj', 'galinho da serra',
    'maricá', 'marica', 'audax-rj', 'audax rio'
  ];

  static const List<String> _cariocaA2Clubs = [
    'olaria', 'alviverde da rua bariri', 'bariri',
    'américa-rj', 'america-rj', 'mecão', 'mecao',
    'americano', 'cano', 'goytacaz', 'goyta',
    'cabofriense', 'serrano-rj', 'friburguense', 'fri',
    'petrópolis', 'petropolis', 'gonçalense', 'duque de caxias',
    'artsul', 'resende', 'araruama', 'audax rio', 'audax-rj'
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

  bool _isA1News(String text) {
    final hasExplicitA1 = text.contains('campeonato carioca') ||
        text.contains('carioca série a') ||
        text.contains('carioca serie a') ||
        text.contains('cariocão') ||
        text.contains('cariocao') ||
        text.contains('taça guanabara') ||
        text.contains('taca guanabara') ||
        text.contains('taça rio') ||
        text.contains('taca rio') ||
        text.contains('futebol carioca');
    if (hasExplicitA1) return true;

    return _hasClub(text, _cariocaA1Clubs);
  }

  bool _isA2News(String text) {
    final hasExplicitA2 = text.contains('carioca série a2') ||
        text.contains('carioca serie a2') ||
        text.contains('carioca a2') ||
        text.contains('segunda divisão do carioca') ||
        text.contains('segunda divisao do carioca') ||
        text.contains('série a2 do carioca') ||
        text.contains('serie a2 do carioca');
    if (hasExplicitA2) return true;

    return _hasClub(text, _cariocaA2Clubs);
  }

  bool _matchesFilter(News news) {
    final t = '${news.title} ${news.description}'.toLowerCase();

    // Filtro negativo contra ruídos externos (política, outros esportes)
    if (_excludedKeywords.any((kw) => t.contains(kw))) {
      return false;
    }

    if (indexTab == 0) {
      // Aba 'Todas'
      return true;
    } else if (indexTab == 1) {
      // Aba 'Carioca Série A'
      return _isA1News(t);
    } else if (indexTab == 2) {
      // Aba 'Carioca Série A2'
      return _isA2News(t);
    } else if (indexTab == 3) {
      // Aba 'Mercado da Bola'
      final isCariocaFootball = _isA1News(t) ||
          _isA2News(t) ||
          _hasClub(t, _cariocaA1Clubs) ||
          _hasClub(t, _cariocaA2Clubs) ||
          t.contains('carioca') ||
          t.contains('cariocão') ||
          t.contains('cariocao');
      if (!isCariocaFootball) return false;

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
              colorFilter: ColorFilter.mode(Theme.of(context).colorScheme.onSurface, BlendMode.srcIn),
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
              final filteredNews = state.news.where((n) => _matchesFilter(n)).toList();
              final carouselNews = filteredNews.take(5).toList();
              final listNews = filteredNews.skip(5).toList();

              return ListView(
                children: [
                  _buildCompetitionFilters(),
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
                        if (i > 0 && i % 6 == 0) {
                          return Column(
                            children: [
                              const AppNativeAdWidget(variant: NativeAdVariant.newsOrVideo),
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
