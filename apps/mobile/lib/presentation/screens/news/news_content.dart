part of '../screens.dart';

class NewsContentScreen extends StatelessWidget {
  const NewsContentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
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
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        children: [
          const Gap(10),
          SizedBox(
            width: context.width,
            height: context.height * .3,
            child: const CardNoImage(radius: 15),
          ),
          const Gap(10),
          Text(
            'Ronaldo denies mega-money AL Nassr deal is signed and sealed',
            style: context.textTheme.bodyLarge,
          ),
          const Gap(10),
          Row(
            children: [
              Text(
                '10 hours ago .',
                style: context.textTheme.labelSmall!.copyWith(fontSize: 13),
              ),
              const Gap(10),
              const Text(
                '#football',
                style: TextStyle(fontSize: 13, color: AppColor.primary),
              ),
              const Gap(5),
              const Text(
                '#worldcup',
                style: TextStyle(fontSize: 13, color: AppColor.primary),
              ),
              const Gap(5),
              const Text(
                '#cristianoronaldo',
                style: TextStyle(fontSize: 13, color: AppColor.primary),
              ),
            ],
          ),
          const Gap(10),
          Text(
            AppText.newsBody,
            style: context.textTheme.bodySmall,
          ),
          const Gap(10),
          Text(
            'Related News',
            style: context.textTheme.bodyMedium,
          ),
          const Gap(10),
          ListView.separated(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            padding: EdgeInsets.zero,
            itemBuilder: (_, i) {
              return const CardNewsItem();
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: 5,
          ),
          const Gap(90),
        ],
      ),
    );
  }
}
