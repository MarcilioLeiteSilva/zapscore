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
                    child: Image.network(news!.imageUrl!,
                        fit: BoxFit.cover, width: double.infinity, height: double.infinity),
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
                    child: const Text(
                      'NEWS',
                      style: TextStyle(
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

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = isVideo ? (video?.title ?? 'Video Title') : (news?.title ?? 'News Title');
    final image = isVideo ? video?.thumbnailUrl : news?.imageUrl;
    final date = isVideo ? video?.date : news?.date;

    return InkWell(
      onTap: () {
        if (isVideo) {
          context.pushNamed(screenWatchContent);
        } else if (news?.externalUrl != null) {
          _launchUrl(news!.externalUrl!);
        } else {
          context.pushNamed(screenNewsContent);
        }
      },
      borderRadius: BorderRadius.circular(10),
      child: Ink(
        width: context.width,
        child: Row(
          children: [
            Stack(
              children: [
                SizedBox(
                  width: 130,
                  height: 100,
                  child: image != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(image, fit: BoxFit.cover),
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
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Theme.of(context).primaryColor,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: context.textTheme.bodySmall!.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const Gap(4),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 12, color: context.textTheme.labelSmall?.color),
                      const Gap(4),
                      Text(
                        date != null ? DateFormat('dd/MM HH:mm').format(date) : 'Recently',
                        style: context.textTheme.labelSmall,
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
  const CardNewsCarouselItem({super.key, this.isVideo = false, this.news, this.video});
  final bool isVideo;
  final News? news;
  final Video? video;

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = isVideo ? (video?.title ?? 'Video Title') : (news?.title ?? 'News Title');
    final image = isVideo ? video?.thumbnailUrl : news?.imageUrl;
    final date = isVideo ? video?.date : news?.date;

    return Ink(
      width: context.width * .95,
      padding: const EdgeInsets.only(right: 5),
      child: InkWell(
        onTap: () {
          if (isVideo) {
            context.pushNamed(screenWatchContent);
          } else if (news?.externalUrl != null) {
            _launchUrl(news!.externalUrl!);
          } else {
            context.pushNamed(screenNewsContent);
          }
        },
        borderRadius: BorderRadius.circular(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  image != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(15),
                          child: Image.network(image,
                              fit: BoxFit.cover, width: double.infinity, height: double.infinity),
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
                  date != null ? DateFormat('dd/MM HH:mm').format(date) : 'Recently',
                  style: context.textTheme.labelSmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
