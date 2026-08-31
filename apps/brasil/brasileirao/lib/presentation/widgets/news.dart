part of 'widgets.dart';

class CardStoryItem extends StatelessWidget {
  final News? news;
  const CardStoryItem({super.key, this.news});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        // context.pushNamed(screenNewsContent);
      },
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: context.width * .4,
        child: Stack(
          children: [
            news?.imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: CachedNetworkImage(
                      imageUrl: proxyImage(news!.imageUrl!),
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorWidget: (context, url, error) => const CardNoImage(radius: 10),
                    ),
                  )
                : const CardNoImage(radius: 10),
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor,
                      borderRadius: BorderRadius.circular(5),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    child: Text(
                      'news_label'.tr(context).toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Text(
                    news?.title ?? 'Leao hails hat-trick hero ramos as president purrs over Portugal',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: context.textTheme.bodySmall!.copyWith(fontSize: 14),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
class CardNewsItem extends StatelessWidget {
  const CardNewsItem({super.key, this.isVideo = false, this.news, this.video});
  final bool isVideo;
  final News? news;
  final Video? video;


  @override
  Widget build(BuildContext context) {
    final title = isVideo ? (video?.title ?? 'video_title'.tr(context)) : (news?.title ?? 'news_title'.tr(context));
    final image = isVideo 
        ? (video?.thumbnailUrl ?? video?.leagueLogo ?? video?.teamLogo) 
        : (news?.imageUrl ?? news?.leagueLogo ?? news?.teamLogo);
    final date = isVideo ? video?.date : news?.date;

    return InkWell(
      onTap: () {
        AdService.instance.showInterstitialAd(onAdClosed: () {
          if (isVideo && video != null) {
            context.pushNamed(screenWatchContent, extra: video);
          } else if (news != null) {
            context.pushNamed(screenNewsContent, extra: news);
          }
        });
      },
      borderRadius: BorderRadius.circular(10),
      child: Ink(
        width: context.width,
        child: Row(
          children: [
            Stack(
              children: [
                Container(
                  width: 120, // Voltado para tamanho grande
                  height: 90, 
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Theme.of(context).cardColor,
                  ),
                  child: image != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Padding(
                            padding: (image.contains('logo') || image.contains('badge')) 
                                ? const EdgeInsets.all(20.0) // Ícone pequeno se for logo
                                : EdgeInsets.zero,
                            child: CachedNetworkImage(
                              imageUrl: proxyImage(image), 
                              fit: isVideo ? BoxFit.cover : ((image.contains('logo') || image.contains('badge')) ? BoxFit.contain : BoxFit.cover),
                              progressIndicatorBuilder: (context, url, downloadProgress) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                              errorWidget: (context, url, error) => const CardNoImage(radius: 10),
                            ),
                          ),
                        )
                      : const CardNoImage(radius: 10),
                ),
                if (isVideo)
                  Positioned(
                    bottom: 5,
                    right: 5,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(5),
                        color: Colors.black45,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      child: Text(
                        video?.duration ?? '04:26',
                        style: const TextStyle(
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const Gap(10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  if (news?.source != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        news!.source!.toUpperCase(),
                        style: GoogleFonts.urbanist(
                          textStyle: context.textTheme.labelSmall!.copyWith(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.1,
                          ),
                        ),
                      ),
                    ),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.urbanist(
                      textStyle: context.textTheme.bodySmall!.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Gap(4),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 12, color: context.textTheme.labelSmall?.color),
                      const Gap(4),
                      Text(
                        date != null ? '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}' : 'recently'.tr(context),
                        style: GoogleFonts.urbanist(
                          textStyle: context.textTheme.labelSmall,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CardNewsCarouselItem extends StatelessWidget {
  const CardNewsCarouselItem({
    super.key,
    this.isVideo = false,
    this.onlyThumb = false,
    this.news,
    this.video,
  });

  final bool isVideo;
  final bool onlyThumb;
  final News? news;
  final Video? video;

  @override
  Widget build(BuildContext context) {
    final title = isVideo ? (video?.title ?? 'video_title'.tr(context)) : (news?.title ?? 'news_title'.tr(context));
    final image = isVideo 
        ? (video?.thumbnailUrl ?? video?.leagueLogo ?? video?.teamLogo) 
        : (news?.imageUrl ?? news?.leagueLogo ?? news?.teamLogo);
    final date = isVideo ? video?.date : news?.date;

    final double cardWidth = onlyThumb ? context.width * .65 : context.width * .95;
    final double cardHeight = onlyThumb ? 130 : context.height * .22;

    return Ink(
      width: cardWidth,
      padding: const EdgeInsets.only(right: 5),
      child: InkWell(
        onTap: () {
          AdService.instance.showInterstitialAd(onAdClosed: () {
            if (isVideo && video != null) {
              context.pushNamed(screenWatchContent, extra: video);
            } else if (news != null) {
              context.pushNamed(screenNewsContent, extra: news);
            }
          });
        },
        borderRadius: BorderRadius.circular(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: cardHeight,
              child: Stack(
                children: [
                  image != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(15),
                          child: Padding(
                            padding: (image.contains('logo') || image.contains('badge'))
                                ? const EdgeInsets.all(30.0)
                                : EdgeInsets.zero,
                            child: CachedNetworkImage(
                              imageUrl: proxyImage(image),
                              fit: isVideo ? BoxFit.cover : ((image.contains('logo') || image.contains('badge')) ? BoxFit.contain : BoxFit.cover),
                              width: double.infinity,
                              height: double.infinity,
                              errorWidget: (context, url, error) => const CardNoImage(radius: 15),
                            ),
                          ),
                        )
                      : const CardNoImage(radius: 15),
                  if (isVideo)
                    Positioned(
                      bottom: 10,
                      right: 10,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          color: Colors.black45,
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        child: Text(
                          video?.duration ?? '04:26',
                          style: const TextStyle(
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (!onlyThumb) ...[
              const Gap(8),
              if (news?.source != null)
                Text(
                  news!.source!.toUpperCase(),
                  style: context.textTheme.labelSmall!.copyWith(
                    color: Theme.of(context).primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              const Gap(2),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: context.textTheme.bodyMedium!.copyWith(fontWeight: FontWeight.bold),
              ),
              const Gap(4),
              Row(
                children: [
                  Icon(Icons.access_time, size: 12, color: context.textTheme.labelSmall?.color),
                  const Gap(4),
                  Text(
                    date != null ? '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}' : 'recently'.tr(context),
                    style: context.textTheme.labelSmall,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
