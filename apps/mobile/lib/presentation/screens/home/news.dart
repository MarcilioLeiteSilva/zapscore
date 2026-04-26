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
      body: ListView(
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
          SizedBox(
            width: context.width,
            height: context.height * .3,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              itemBuilder: (_, i) {
                return const CardNewsCarouselItem();
              },
              separatorBuilder: (_, i) => const Gap(10),
              itemCount: 5,
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
              return const CardNewsItem();
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: 10,
          ),
          const Gap(80),
        ],
      ),
    );
  }
}
