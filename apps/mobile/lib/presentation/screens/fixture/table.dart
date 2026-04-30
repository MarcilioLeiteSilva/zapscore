part of '../screens.dart';

class TableFixPage extends StatelessWidget {
  const TableFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is! FixtureLoaded) {
          return const Center(child: CircularProgressIndicator());
        }

        final allStandings = state.standings;
        if (allStandings.isEmpty) {
          return const Center(child: Text('Tabela não disponível para esta liga'));
        }

        // Agrupar por grupo
        final Map<String, List<Standing>> groups = {};
        for (var s in allStandings) {
          groups.putIfAbsent(s.group, () => []).add(s);
        }

        // Identificar qual grupo exibir primeiro ou destacar (o que contém os times da partida)
        final homeTeamId = state.fixture.homeTeam?.externalId;
        final awayTeamId = state.fixture.awayTeam?.externalId;
        
        final groupKeys = groups.keys.toList()..sort();

        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
          itemCount: groupKeys.length,
          itemBuilder: (context, index) {
            final groupName = groupKeys[index];
            final standings = groups[groupName]!;
            final isMatchGroup = standings.any((s) => s.teamId == homeTeamId || s.teamId == awayTeamId);

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (groupKeys.length > 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 5),
                    child: Text(
                      groupName,
                      style: context.textTheme.bodyMedium!.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isMatchGroup ? Theme.of(context).primaryColor : null,
                      ),
                    ),
                  ),
                Container(
                  width: context.width,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 15,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    color: Theme.of(context).cardColor.withOpacity(0.8),
                    border: isMatchGroup ? Border.all(color: Theme.of(context).primaryColor.withOpacity(0.3), width: 1) : null,
                  ),
                  child: Table(
                    columnWidths: const {
                      0: FlexColumnWidth(1),
                      1: FlexColumnWidth(4.5),
                      2: FlexColumnWidth(1),
                      3: FlexColumnWidth(1),
                      4: FlexColumnWidth(1.2),
                    },
                    defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                    children: [
                      TableRow(
                        decoration: BoxDecoration(
                          border: Border(
                              bottom: BorderSide(
                            color: (context.appColors.info ?? Colors.grey).withOpacity(0.2),
                            width: 1,
                          )),
                        ),
                        children: const [
                          TableTileItem(
                            '#',
                            padding: EdgeInsets.only(bottom: 15),
                            isCrossCenter: true,
                          ),
                          TableTileItem(
                            'TEAM',
                            padding: EdgeInsets.only(bottom: 15),
                          ),
                          TableTileItem(
                            'P',
                            padding: EdgeInsets.only(bottom: 15),
                            isCrossCenter: true,
                          ),
                          TableTileItem(
                            'GD',
                            padding: EdgeInsets.only(bottom: 15),
                            isCrossCenter: true,
                          ),
                          TableTileItem(
                            'PTS',
                            padding: EdgeInsets.only(bottom: 15),
                            isCrossCenter: true,
                          ),
                        ],
                      ),
                      for (var item in standings)
                        TableRow(
                          decoration: BoxDecoration(
                            color: (item.teamId == homeTeamId || item.teamId == awayTeamId)
                                ? Theme.of(context).primaryColor.withOpacity(0.1)
                                : null,
                            border: Border(
                                bottom: BorderSide(
                              color: (context.appColors.info ?? Colors.grey).withOpacity(0.1),
                              width: 1,
                            )),
                          ),
                          children: [
                            TableTileItem(
                              '${item.rank}',
                              isTop: item.rank <= 2, // Geralmente os 2 primeiros passam em grupos
                              isCrossCenter: true,
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 25,
                                    height: 25,
                                    child: item.teamLogo != null
                                        ? Image.network(item.teamLogo!, fit: BoxFit.contain)
                                        : const CardNoImage(radius: 5),
                                  ),
                                  const Gap(10),
                                  Expanded(
                                    child: Text(
                                      item.teamName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: (item.teamId == homeTeamId || item.teamId == awayTeamId)
                                            ? FontWeight.bold
                                            : null,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            TableTileItem('${item.played}', isCrossCenter: true),
                            TableTileItem('${item.goalsDiff}', isCrossCenter: true),
                            TableTileItem(
                              '${item.points}',
                              isCrossCenter: true,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
                const Gap(20),
              ],
            );
          },
        );
      },
    );
  }
}
