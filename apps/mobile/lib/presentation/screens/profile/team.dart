part of '../screens.dart';

class TeamProfileScreen extends StatefulWidget {
  const TeamProfileScreen({super.key, required this.team, this.leagueId});
  final Team team;
  final int? leagueId;

  @override
  State<TeamProfileScreen> createState() => _TeamProfileScreenState();
}

class _TeamProfileScreenState extends State<TeamProfileScreen> {
  int indexTab = 0;

  List<String> getTabs(BuildContext context) {
    return [
      'overview'.tr(context),
      'matches'.tr(context),
      'table'.tr(context),
      'news'.tr(context),
      'team_stats'.tr(context),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => TeamCubit(context.read<HomeCubit>().apiClient)
        ..fetchTeamData(widget.team.externalId, preferredLeagueId: widget.leagueId),
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
              color: Theme.of(context).scaffoldBackgroundColor,
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Material(
                color: Colors.transparent,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemBuilder: (_, i) {
                    final tabs = getTabs(context);
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
                  itemCount: getTabs(context).length,
                ),
              ),
            ),
            Expanded(
              child: [
                const TeamOverview(),
                const MatchTeamPage(),
                const TeamTablePage(),
                TeamNewsPage(teamId: widget.team.id, leagueId: widget.leagueId),
                const TeamStatePage(),
              ][indexTab],
            ),
          ],
        ),
      ),
    );
  }
}
