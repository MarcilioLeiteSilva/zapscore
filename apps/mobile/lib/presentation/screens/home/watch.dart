part of '../screens.dart';

class WatchPage extends StatelessWidget {
  const WatchPage({super.key});

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
      body: RefreshIndicator(
        onRefresh: () => context.read<VideoCubit>().fetchVideos(),
        child: BlocBuilder<VideoCubit, VideoState>(
          builder: (context, state) {
            if (state is VideoLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is VideoError) {
              return Center(child: Text(state.message));
            }
            if (state is VideoLoaded) {
              if (state.videos.isEmpty) {
                return const Center(child: Text('Nenhum vídeo encontrado'));
              }

              final carouselVideos = state.videos.take(5).toList();
              final trendingVideos = state.videos.skip(5).toList();

              return ListView(
                children: [
                  const Gap(10),
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
