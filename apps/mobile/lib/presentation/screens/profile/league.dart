part of '../screens.dart';

class LeagueProfileScreen extends StatefulWidget {
  const LeagueProfileScreen({super.key, required this.league});
  final League league;

  @override
  State<LeagueProfileScreen> createState() => _LeagueProfileScreenState();
}

class _LeagueProfileScreenState extends State<LeagueProfileScreen> {
  int indexTab = 0;
  List<String> listLeague = [
    "Classificação",
    "Rodadas",
    "Jogos",
    "Artilharia",
  ];

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
                      color: isFav ? Colors.amber : Colors.white,
                    ),
                  );
                },
              ),
            ],
          ),
          body: Column(
            children: [
            Container(
              width: context.width,
              height: 60,
              color: AppColor.background,
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
