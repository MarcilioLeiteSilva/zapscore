part of '../screens.dart';

class TeamProfileScreen extends StatefulWidget {
  const TeamProfileScreen({super.key, required this.team});
  final Team team;

  @override
  State<TeamProfileScreen> createState() => _TeamProfileScreenState();
}

class _TeamProfileScreenState extends State<TeamProfileScreen> {
  int indexTab = 0;
  List<String> listLeague = [
    "Overview",
    "Matches",
    "Table",
    "News",
    "Team Stats"
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.team.name),
        actions: [
          BlocBuilder<FavoriteCubit, FavoriteState>(
            builder: (context, favState) {
              final isFav = context
                  .read<FavoriteCubit>()
                  .isTeamFavorite(widget.team.id);
              return IconButton(
                onPressed: () {
                  context.read<FavoriteCubit>().toggleTeam(widget.team.id);
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
            height: 62,
            color: AppColor.background,
            padding: const EdgeInsets.symmetric(vertical: 10),
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
            child: const [
              TeamOverview(),
              MatchTeamPage(),
              TableLeaguePage(),
              NewsLeaguePage(),
              TeamStatePage(),
            ][indexTab],
          ),
        ],
      ),
    );
  }
}
