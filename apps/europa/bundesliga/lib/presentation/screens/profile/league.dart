part of '../screens.dart';

class LeagueProfileScreen extends StatefulWidget {
  const LeagueProfileScreen({super.key, required this.league, this.initialIndex = 0});
  final League league;
  final int initialIndex;

  @override
  State<LeagueProfileScreen> createState() => _LeagueProfileScreenState();
}

class _LeagueProfileScreenState extends State<LeagueProfileScreen> {
  late int indexTab;
  List<String> listLeague = [
    "Classificação",
    "Rodadas",
    "Jogos",
    "Artilharia",
  ];

  @override
  void initState() {
    super.initState();
    indexTab = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => LeagueCubit(context.read<HomeCubit>().apiClient)
        ..fetchLeagueData(widget.league.externalId),
      child: BlocListener<LeagueCubit, LeagueState>(
        listener: (context, state) {
          if (state is LeagueError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: ${state.message}')),
            );
          }
        },
        child: Scaffold(
          appBar: AppBar(
            title: Text(widget.league.name),
            flexibleSpace: buildBlurFlexibleSpace(),
            actions: [
              BlocBuilder<FavoriteCubit, FavoriteState>(
                builder: (context, favState) {
                  final isFav = context
                      .read<FavoriteCubit>()
                      .isLeagueFavorite(widget.league.externalId.toString());
                  return IconButton(
                    onPressed: () {
                      context
                          .read<FavoriteCubit>()
                          .toggleLeague(widget.league.externalId.toString());
                    },
                    icon: Icon(
                      isFav ? Icons.star : Icons.star_border,
                      color: isFav ? const Color(0xFFAA7A13) : Colors.white,
                    ),
                  );
                },
              ),
            ],
          ),
          body: Column(
            children: [
            ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  width: context.width,
                  height: 60,
                  color: (Theme.of(context).appBarTheme.backgroundColor ?? Theme.of(context).scaffoldBackgroundColor).withOpacity(0.70),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Material(
                    color: Colors.transparent,
                    child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
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
          ),
        ),
        Expanded(
              child: [
                const TableLeaguePage(),
                const RoundLeaguePage(),
                const MatchLeaguePage(),
                const TopScoreLeaguePage(),
              ][indexTab],
            ),
          ],
        ),
      ),
    ),
  );
}
}
