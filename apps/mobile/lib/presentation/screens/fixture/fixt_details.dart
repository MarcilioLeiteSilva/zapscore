part of '../screens.dart';

class FixtureDetails extends StatefulWidget {
  const FixtureDetails({super.key, required this.fixture});
  final Fixture fixture;

  @override
  State<FixtureDetails> createState() => _FixtureDetailsState();
}

class _FixtureDetailsState extends State<FixtureDetails> {
  final _controller = ScrollController();

  int indexTab = 0;
  List<String> tabs = [
    "Info",
    "Summary",
    "Report",
    "Stats",
    "Lineups",
    "Table",
    "H2H"
  ];

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => FixtureCubit(context.read<HomeCubit>().apiClient)
        ..fetchFixtureDetails(widget.fixture.id),
      child: BlocBuilder<FixtureCubit, FixtureState>(
        builder: (context, state) {
          final currentFixture = state is FixtureLoaded ? state.fixture : widget.fixture;

          return Scaffold(
            body: NestedScrollView(
              controller: _controller,
              headerSliverBuilder: (context, bol) {
                return [
                  SliverAppBar(
                    title: const Text('Match Details'),
                    centerTitle: true,
                    pinned: true,
                    expandedHeight: context.height * .43,
                    actions: [
                      BlocBuilder<FavoriteCubit, FavoriteState>(
                        builder: (context, favState) {
                          final isFav = context
                              .read<FavoriteCubit>()
                              .isFixtureFavorite(widget.fixture.id);
                          return IconButton(
                            onPressed: () {
                              context
                                  .read<FavoriteCubit>()
                                  .toggleFixture(widget.fixture.id);
                            },
                            icon: Icon(
                              isFav ? Icons.star : Icons.star_border,
                              color: isFav ? Colors.amber : Colors.white,
                            ),
                          );
                        },
                      ),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: Column(
                        children: [
                          const Gap(115),
                          CardFixtureDetail(fixture: currentFixture),
                        ],
                      ),
                    ),
                    bottom: PreferredSize(
                      preferredSize: Size(context.width, 43),
                      child: Container(
                        width: context.width,
                        height: 45,
                        color: AppColor.background,
                        child: Material(
                          color: Colors.transparent,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            itemBuilder: (_, i) {
                              return CardCheepTabSearch(
                                select: indexTab == i,
                                label: tabs[i],
                                onTap: () {
                                  setState(() {
                                    indexTab = i;
                                  });
                                },
                              );
                            },
                            separatorBuilder: (_, i) => const Gap(10),
                            itemCount: tabs.length,
                          ),
                        ),
                      ),
                    ),
                  ),
                ];
              },
              body: state is FixtureLoading
                  ? const Center(child: CircularProgressIndicator())
                  : [
                      const InfoFixPage(),
                      const SummaryFixPage(),
                      const ReportFixPage(),
                      const StatsFixPage(),
                      const LineupsFixPage(),
                      const TableFixPage(),
                      const H2hFixPage(),
                    ][indexTab],
            ),
          );
        },
      ),
    );
  }
}
