part of '../screens.dart';

class WatchPage extends StatefulWidget {
  const WatchPage({super.key});

  @override
  State<WatchPage> createState() => _WatchPageState();
}

class _WatchPageState extends State<WatchPage> {
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
          height: 60,
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
                    context.read<VideoCubit>().fetchVideos(leagueId: selectedLeagueId, limit: 100);
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
        title: const Text("Watch"),
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
            context.read<VideoCubit>().fetchVideos(leagueId: selectedLeagueId, limit: 100);
          }
        },
        child: RefreshIndicator(
          onRefresh: () => context.read<VideoCubit>().fetchVideos(leagueId: selectedLeagueId, limit: 100),
          child: BlocBuilder<VideoCubit, VideoState>(
            builder: (context, state) {
              if (state is VideoLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state is VideoError) {
                return Center(child: Text(state.message));
              }
              if (state is VideoLoaded) {
                final carouselVideos = state.videos.take(5).toList();
                final trendingVideos = state.videos.skip(5).toList();
  
                return ListView(
                  children: [
                    _buildCompetitionFilters(),
                    if (state.videos.isEmpty)
                      const SizedBox(
                        height: 300,
                        child: Center(child: Text('Nenhum vídeo encontrado para esta competição')),
                      )
                    else ...[
                      const Gap(10),
                      if (carouselVideos.isNotEmpty)
                      SizedBox(
                        width: context.width,
                        height: context.height * .3,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          itemBuilder: (_, i) {
                            return CardNewsCarouselItem(
                              isVideo: true,
                              video: carouselVideos[i],
                            );
                          },
                          separatorBuilder: (_, i) => const Gap(10),
                          itemCount: carouselVideos.length,
                        ),
                      ),
                      const Gap(20),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'Short Live Streaming',
                          style: context.textTheme.bodyMedium,
                        ),
                      ),
                      const Gap(10),
                      SizedBox(
                        width: context.width,
                        height: context.height * .25,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          itemBuilder: (_, i) {
                            return const CardStoryItem();
                          },
                          separatorBuilder: (_, i) => const Gap(10),
                          itemCount: 5,
                        ),
                      ),
                      const Gap(20),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'Highlights',
                          style: context.textTheme.bodyMedium,
                        ),
                      ),
                      const Gap(20),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const ScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        itemBuilder: (_, i) {
                          return CardNewsItem(
                            isVideo: true,
                            video: trendingVideos.isNotEmpty ? trendingVideos[i % trendingVideos.length] : null,
                          );
                        },
                        separatorBuilder: (_, i) => const Gap(15),
                        itemCount: trendingVideos.isNotEmpty ? trendingVideos.length : 5,
                      ),
                    ],
                    const Gap(90),
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
