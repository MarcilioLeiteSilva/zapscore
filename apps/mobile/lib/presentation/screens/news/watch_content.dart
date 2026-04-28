part of '../screens.dart';

class WatchContentScreen extends StatefulWidget {
  final Video video;
  const WatchContentScreen({super.key, required this.video});

  @override
  State<WatchContentScreen> createState() => _WatchContentScreenState();
}

class _WatchContentScreenState extends State<WatchContentScreen> {
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
    final videoId = YoutubePlayer.convertUrlToId(widget.video.videoUrl) ?? '';
    _controller = YoutubePlayerController(
      initialVideoId: videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.video.title, style: const TextStyle(fontSize: 16)),
        actions: [
          IconButton(
            onPressed: () {},
            icon: SvgPicture.asset(Assets.share),
          ),
          IconButton(
            onPressed: () {},
            icon: SvgPicture.asset(Assets.more),
          ),
        ],
      ),
      body: Column(
        children: [
          YoutubePlayer(
            controller: _controller,
            showVideoProgressIndicator: true,
            progressIndicatorColor: AppColor.primary,
            progressColors: const ProgressBarColors(
              playedColor: AppColor.primary,
              handleColor: AppColor.primary,
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              children: [
                const Gap(15),
                Text(
                  widget.video.title,
                  style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const Gap(10),
                Row(
                  children: [
                    if (widget.video.leagueLogo != null) ...[
                      Image.network(widget.video.leagueLogo!, height: 20),
                      const Gap(10),
                    ],
                    Text(
                      'Highlights - 2026 Season',
                      style: context.textTheme.labelSmall!.copyWith(fontSize: 13),
                    ),
                  ],
                ),
                if (widget.video.description != null && widget.video.description!.isNotEmpty) ...[
                  const Gap(15),
                  Text(
                    widget.video.description!,
                    style: context.textTheme.bodySmall,
                  ),
                ],
                const Divider(height: 35),
                Text(
                  'More Videos',
                  style: context.textTheme.bodyMedium,
                ),
                const Gap(10),
                BlocBuilder<VideoCubit, VideoState>(
                  builder: (context, state) {
                    if (state is VideoLoaded) {
                      final relatedVideos = state.videos.where((v) => v.id != widget.video.id).take(5).toList();
                      return ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: EdgeInsets.zero,
                        itemBuilder: (_, i) {
                          return CardNewsItem(
                            isVideo: true,
                            video: relatedVideos[i],
                          );
                        },
                        separatorBuilder: (_, i) => const Gap(15),
                        itemCount: relatedVideos.length,
                      );
                    }
                    return const SizedBox();
                  },
                ),
                const Gap(90),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
