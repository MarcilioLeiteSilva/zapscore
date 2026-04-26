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
    return BlocProvider(
      create: (context) => TeamCubit(ApiClient())..fetchTeamData(widget.team.externalId),
      child: Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              if (widget.team.logo != null) ...[
                Image.network(widget.team.logo!, width: 30, height: 30),
                const Gap(10),
              ],
              Expanded(child: Text(widget.team.name, overflow: TextOverflow.ellipsis)),
            ],
          ),
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
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  if (widget.team.logo != null)
                    Image.network(widget.team.logo!, height: 80)
                  else
                    const CardNoImage(radius: 40),
                  const Gap(10),
                  Text(
                    widget.team.name,
                    style: context.textTheme.bodyLarge!.copyWith(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  if (widget.team.country != null)
                    Text(
                      widget.team.country!,
                      style: context.textTheme.labelSmall,
                    ),
                ],
              ),
            ),
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
              child: [
                const TeamOverview(),
                const MatchTeamPage(),
                const TeamTablePage(),
                const NewsLeaguePage(),
                const TeamStatePage(),
              ][indexTab],
            ),
          ],
        ),
      ),
    );
  }
}
