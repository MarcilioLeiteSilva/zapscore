part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;
  String? selectedLeagueId;

  Widget _buildCompetitionFilters() {
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (context, homeState) {
        final List<Map<String, String?>> categories = [];
        
        if (homeState is HomeLoaded) {
          for (var comp in homeState.competitions) {
            categories.add({
              'name': comp.league.name,
              'id': comp.league.id
            });
          }
        }

        if (categories.isEmpty) return const SizedBox();

        return Container(
          width: context.width,
          height: 45, // Reduzido de 60 para 45
          color: Theme.of(context).scaffoldBackgroundColor,
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Material(
            color: Colors.transparent,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemBuilder: (_, i) {
                final cat = categories[i];
                final isSelected = selectedLeagueId == cat['id'];
                return CardCheepTabSearch(
                  select: isSelected,
                  label: cat['name']!,
                  onTap: () {
                    setState(() {
                      indexTab = i;
                      selectedLeagueId = cat['id'];
                    });
                    context.read<NewsCubit>().fetchNews(leagueId: selectedLeagueId, limit: 100);
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
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Text("news".tr(context)),
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () => context.pushNamed(screenSearch),
            icon: SvgPicture.asset(
              Assets.searchLine,
              color: Colors.white,
              height: 25,
            ),
          ),
        ],
      ),
      body: BlocListener<HomeCubit, HomeState>(
        listener: (context, state) {
          if (state is HomeLoaded && state.competitions.isNotEmpty && selectedLeagueId == null) {
            setState(() {
              selectedLeagueId = state.competitions.first.league.id;
              indexTab = 0;
            });
            context.read<NewsCubit>().fetchNews(leagueId: selectedLeagueId, limit: 100);
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
                        child: Center(child: Text('Nenhuma notícia encontrada para esta competição')),
                      )
                    else ...[
                      const Gap(10),
                      if (carouselNews.isNotEmpty)
                        SizedBox(
                          width: context.width,
                          height: context.height * .3,
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
