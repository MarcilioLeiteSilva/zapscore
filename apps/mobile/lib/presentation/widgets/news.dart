part of 'widgets.dart';

class CardStoryItem extends StatelessWidget {
  const CardStoryItem({super.key});

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
            const CardNoImage(radius: 10),
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: AppColor.primary,
                      borderRadius: BorderRadius.circular(5),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    child: const Text(
                      'LIVE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Text(
                    'Leao hails hat-trick hero ramos as president purrs over Portugal',
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
  const CardNewsItem({super.key, this.isVideo = false});
  final bool isVideo;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        context.pushNamed(isVideo ? screenWatchContent : screenNewsContent);
      },
      borderRadius: BorderRadius.circular(10),
      child: Ink(
        width: context.width,
        child: Row(
          children: [
            Stack(
              children: [
                const SizedBox(
                  width: 130,
                  height: 100,
                  child: CardNoImage(radius: 10),
                ),
                Positioned(
                  bottom: 5,
                  right: 5,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      color: Colors.black45,
                    ),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    child: const Text(
                      '04:26',
                      style: TextStyle(
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
                  Text(
                    'Bellingham close to the complete player after England per silence the critic',
                    maxLines: 3,
                    style: context.textTheme.bodySmall,
                  ),
                  Text(
                    '1 hour ago',
                    style: context.textTheme.labelSmall!.copyWith(
                      fontSize: 14,
                    ),
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
  const CardNewsCarouselItem({super.key, this.isVideo = false});
  final bool isVideo;

  @override
  Widget build(BuildContext context) {
    return Ink(
      width: context.width * .95,
      padding: const EdgeInsets.only(right: 5),
      child: InkWell(
        onTap: () {
          context.pushNamed(isVideo ? screenWatchContent : screenNewsContent);
        },
        borderRadius: BorderRadius.circular(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  const CardNoImage(radius: 15),
                  if (isVideo)
                    Positioned(
                      bottom: 10,
                      right: 10,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          color: Colors.black45,
                        ),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 2),
                        child: const Text(
                          '04:26',
                          style: TextStyle(
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const Gap(5),
            const Text(
              'Ronaldo denies mega-money AL Nassr deal is signed and sealed',
            ),
            const Gap(3),
            Text(
              '10 hours ago',
              style: context.textTheme.labelSmall!.copyWith(
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
