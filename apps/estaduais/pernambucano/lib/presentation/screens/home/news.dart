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
    {'name': 'Pernambucano A1', 'type': 'a1'},
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

  static const List<String> _pernambucanoClubs = [
    // Turno Frevo (Série A1 2026)
    'sport', 'sport recife', 'leão da ilha', 'leao da ilha', 'rubro-negro pernambucano',
    'náutico', 'nautico', 'timbu', 'alvirrubro pernambucano',
    'santa cruz', 'cobra coral', 'tricolor do arruda',
    'retrô', 'retro', 'maguary', 'decisão', 'decisao', 'vitória das tabocas', 'vitoria das tabocas', 'vitória-pe', 'vitoria-pe',
    // Turno Forró (24 clubes unificados)
    '1º de maio', '1 de maio', 'afogados', 'facilnet', 'ferroviário do cabo', 'ferroviario do cabo', 'petrolina', 'fera sertaneja', 'salgueiro', 'carcará',
    'belo jardim', 'central', 'patativa', 'chã grande', 'cha grande', 'pesqueira', 'porto', 'porto-pe', 'ypiranga',
    'águia de cumaru', 'aguia de cumaru', 'águia fc', 'aguia fc', 'atlético-pe', 'atletico-pe', 'centro limoeirense', 'jaguar', 'santa fé', 'santa fe', 'serrano',
    'américa-pe', 'america-pe', 'guarany', 'guarany de sobral', 'íbis', 'ibis', 'ipojuca', 'sete de setembro', 'vera cruz', 'flamengo de arcoverde'
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

  bool _isPernambucanoNews(String text) {
    final hasExplicit = text.contains('campeonato pernambucano') ||
        text.contains('pernambucano') ||
        text.contains('turno forró') ||
        text.contains('turno forro') ||
        text.contains('turno frevo') ||
        text.contains('fpf-pe') ||
        text.contains('futebol pernambucano');
    if (hasExplicit) return true;

    return _hasClub(text, _pernambucanoClubs);
  }

  bool _matchesFilter(News news) {
    final t = '${news.title} ${news.description}'.toLowerCase();

    // Filtro negativo contra ruídos externos (política, outros esportes)
    if (_excludedKeywords.any((kw) => t.contains(kw))) {
      return false;
    }

    if (indexTab == 0) {
      // Aba 'Todas' -> Exibe todas as notícias do feed da API
      return true;
    } else if (indexTab == 1) {
      // Aba 'Pernambucano A1' -> Notícias específicas do Pernambucano e seus clubes
      return _isPernambucanoNews(t);
    } else if (indexTab == 2) {
      // Aba 'Mercado da Bola' -> Transferências e negociações dos clubes pernambucanos
      final isPernambucanoFootball = _isPernambucanoNews(t);
      if (!isPernambucanoFootball) return false;

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
