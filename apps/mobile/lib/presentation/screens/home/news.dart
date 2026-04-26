part of '../screens.dart';

class NewsPage extends StatefulWidget {
  const NewsPage({super.key});

  @override
  State<NewsPage> createState() => _NewsPageState();
}

class _NewsPageState extends State<NewsPage> {
  int indexTab = 0;
  List<String> listLeague = [
    "All",
    "Football",
    "World Cup",
    "Premier League",
    "La Liga",
    "Serie A",
    "Al Botoula Pro"
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Text("News"),
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
      body: RefreshIndicator(
        onRefresh: () => context.read<NewsCubit>().fetchNews(),
        child: BlocBuilder<NewsCubit, NewsState>(
          builder: (context, state) {
            if (state is NewsLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is NewsError) {
              return Center(child: Text(state.message));
            }
            if (state is NewsLoaded) {
              if (state.news.isEmpty) {
                return const Center(child: Text('Nenhuma notícia encontrada'));
              }

              final carouselNews = state.news.take(5).toList();
              final listNews = state.news.skip(5).toList();

              return ListView(
                children: [
                  Container(
                    width: context.width,
                    height: 60,
                    color: AppColor.background,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Material(
                      color: Colors.transparent,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemBuilder: (_, i) {
                          return CardCheepTabSearch(
                            select: indexTab == i,
                            label: listLeague[i],
                            onTap: () {
                              setState(() {
                                indexTab = i;
                              });
                            },
                          );
                        },
                        separatorBuilder: (_, i) => const Gap(10),
                        itemCount: listLeague.length,
                      ),
                    ),
                  ),
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
                      'Trending News',
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
