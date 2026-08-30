part of '../screens.dart';

class WatchPage extends StatefulWidget {
  const WatchPage({super.key});

  @override
  State<WatchPage> createState() => _WatchPageState();
}

class _WatchPageState extends State<WatchPage> {
  int indexTab = 0;
  String? selectedFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VideoCubit>().fetchVideos(leagueId: '78', limit: 100);
    });
  }

  bool _matchesFilter(Video video, String? filter) {
    if (filter == null || filter.isEmpty || filter == 'Bundesliga') return true;
    final f = filter.toLowerCase();
    return video.title.toLowerCase().contains(f) ||
        (video.description != null && video.description!.toLowerCase().contains(f));
  }

  List<Map<String, String?>> _generateDynamicCategories(List<Video> allVideos, HomeState homeState) {
    final List<Map<String, String?>> categories = [
      {'name': 'Bundesliga', 'filter': null},
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

    final Set<String> addedNames = {'Bundesliga'};
    for (var cand in candidates) {
      if (addedNames.contains(cand)) continue;
      final hasMatch = allVideos.any((v) => _matchesFilter(v, cand));
      if (hasMatch) {
        addedNames.add(cand);
        categories.add({'name': cand, 'filter': cand});
      }
    }

    return categories;
  }

  Widget _buildCompetitionFilters(List<Video> allVideos) {
    return BlocBuilder<HomeCubit, HomeState>(
      builder: (context, homeState) {
        final categories = _generateDynamicCategories(allVideos, homeState);

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
        title: Text("watch".tr(context)),
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
        onRefresh: () => context.read<VideoCubit>().fetchVideos(leagueId: '78', limit: 100),
        child: BlocBuilder<VideoCubit, VideoState>(
          builder: (context, state) {
            if (state is VideoLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is VideoError) {
              return Center(child: Text(state.message));
            }
            if (state is VideoLoaded) {
              final filteredVideos = state.videos.where((v) => _matchesFilter(v, selectedFilter)).toList();
              final carouselVideos = filteredVideos.take(5).toList();
              final trendingVideos = filteredVideos.skip(5).toList();

              return ListView(
                children: [
                  _buildCompetitionFilters(state.videos),
                  if (filteredVideos.isEmpty)
                    const SizedBox(
                      height: 300,
                      child: Center(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Text(
                            'Nenhum vídeo encontrado para o filtro selecionado',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white70, fontSize: 14),
                          ),
                        ),
                      ),
                    )
                  else ...[
                    const Gap(10),
                    if (carouselVideos.isNotEmpty)
                      SizedBox(
                        width: context.width,
                        height: context.height * .35,
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
                        'highlights'.tr(context),
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    const Gap(20),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const ScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      itemBuilder: (_, i) {
                        final currentList = trendingVideos.isNotEmpty ? trendingVideos : carouselVideos;
                        final videoItem = CardNewsItem(
                          isVideo: true,
                          video: currentList[i],
                        );
                        if ((i + 1) % 4 == 0 && (i + 1) < currentList.length) {
                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              videoItem,
                              const Gap(15),
                              NativeAdCardWidget(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                              ),
                            ],
                          );
                        }
                        return videoItem;
                      },
                      separatorBuilder: (_, i) => const Gap(15),
                      itemCount: trendingVideos.isNotEmpty ? trendingVideos.length : carouselVideos.length,
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
    );
  }
}
