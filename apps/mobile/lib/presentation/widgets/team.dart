part of 'widgets.dart';

class MatchTeamPage extends StatelessWidget {
  const MatchTeamPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TeamCubit, TeamState>(
      builder: (context, state) {
        if (state is TeamLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is TeamError) {
          return Center(child: Text(state.message));
        }
        if (state is TeamLoaded) {
          if (state.fixtures.isEmpty) {
            return const Center(child: Text('No matches found'));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            itemBuilder: (_, i) {
              final fixture = state.fixtures[i];
              return Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: CardFixtureItem(
                  fixture: fixture,
                  showDivider: false,
                ),
              );
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: state.fixtures.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

class TeamOverview extends StatelessWidget {
  const TeamOverview({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TeamCubit, TeamState>(
      builder: (context, state) {
        if (state is TeamLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is TeamLoaded) {
          final lastMatch = state.fixtures.isNotEmpty ? state.fixtures.first : null;
          
          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 10),
            children: [
              if (lastMatch != null) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    'Recent Match',
                    style: context.textTheme.headlineSmall!.copyWith(
                      fontSize: 18,
                    ),
                  ),
                ),
                const Gap(10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: CardFixtureItem(fixture: lastMatch, showDivider: false),
                  ),
                ),
              ],
              const Gap(20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'Form',
                  style: context.textTheme.headlineSmall!.copyWith(
                    fontSize: 18,
                  ),
                ),
              ),
              const Gap(15),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: CardFormInfoTeam(),
              ),
              const Gap(20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'Top Scores',
                  style: context.textTheme.headlineSmall!.copyWith(
                    fontSize: 18,
                  ),
                ),
              ),
              const Gap(15),
              Container(
                width: context.width,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  border: Border.all(
                    color: context.appColors.info ?? Colors.transparent,
                    width: 1,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                margin: const EdgeInsets.symmetric(horizontal: 10),
                padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
                child: const Center(child: Text('Coming soon')),
              ),
              const Gap(50),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class CardFormInfoTeam extends StatelessWidget {
  const CardFormInfoTeam({super.key});

  @override
  Widget build(BuildContext context) {
    List<String> forms = ['L', 'L', 'L', 'W', 'L'];
    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Theme.of(context).cardColor.withOpacity(0.8),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                Text(
                  'Last 5',
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                for (var form in forms)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: CircleAvatar(
                      radius: 10,
                      backgroundColor: form == 'L' ? Colors.red : Colors.green,
                      child: Text(
                        form,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Gap(15),
          SizedBox(
            width: context.width,
            height: 45,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              itemBuilder: (_, i) {
                return const CardFormMatch();
              },
              separatorBuilder: (_, i) => const Gap(10),
            ),
          ),
        ],
      ),
    );
  }
}

class TeamTablePage extends StatelessWidget {
  const TeamTablePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TeamCubit, TeamState>(
      builder: (context, state) {
        if (state is TeamLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is TeamLoaded) {
          if (state.standings.isEmpty) {
            return const Center(child: Text('Tabela não disponível para este time no momento'));
          }
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
            children: [
              Container(
                width: context.width,
                padding: const EdgeInsets.symmetric(
                  horizontal: 15,
                  vertical: 15,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  color: Theme.of(context).cardColor.withOpacity(0.8),
                ),
                child: Table(
                  columnWidths: const {
                    0: FlexColumnWidth(1),
                    1: FlexColumnWidth(4),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(1),
                    4: FlexColumnWidth(1),
                    5: FlexColumnWidth(1),
                    6: FlexColumnWidth(1),
                    7: FlexColumnWidth(1.2),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                          color: context.appColors.info ?? Colors.transparent,
                          width: 1,
                        )),
                      ),
                      children: [
                        TableTileItem(
                          '#',
                          padding: EdgeInsets.only(bottom: 15),
                          isCrossCenter: true,
                        ),
                        TableTileItem(
                          'TIME',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'P',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'J',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'V',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'E',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'D',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                        TableTileItem(
                          'SG',
                          padding: EdgeInsets.only(bottom: 15),
                        ),
                      ],
                    ),
                    for (final standing in state.standings)
                      TableRow(
                        decoration: BoxDecoration(
                          border: Border(
                              bottom: BorderSide(
                            color: context.appColors.info ?? Colors.transparent,
                            width: 1,
                          )),
                        ),
                        children: [
                          TableTileItem(
                            '${standing.rank}',
                            isTop: [1, 2, 3, 4].contains(standing.rank),
                            isCrossCenter: true,
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 25,
                                  height: 25,
                                  child: standing.teamLogo != null
                                      ? Image.network(standing.teamLogo!,
                                          fit: BoxFit.contain)
                                      : const CardNoImage(radius: 5),
                                ),
                                const Gap(8),
                                Expanded(
                                  child: Text(
                                    standing.teamName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TableTileItem('${standing.points}'),
                          TableTileItem('${standing.played}'),
                          TableTileItem('${standing.win}'),
                          TableTileItem('${standing.draw}'),
                          TableTileItem('${standing.lose}'),
                          TableTileItem('${standing.goalsDiff}'),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class TeamStatePage extends StatelessWidget {
  const TeamStatePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TeamCubit, TeamState>(
      builder: (context, state) {
        if (state is TeamLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is TeamLoaded) {
          final rawStats = state.stats;
          if (rawStats == null) {
            return const Center(child: Text('Estatísticas não disponíveis'));
          }

          Map<String, dynamic> data = rawStats;
          // Handle possible nesting under 'response'
          if (data.containsKey('response') && data['response'] is Map) {
            data = data['response'];
          }

          final fixtures = data['fixtures'] is Map ? data['fixtures'] : {};
          final goals = data['goals'] is Map ? data['goals'] : {};
          final totalPlayed = fixtures['played'] is Map ? (fixtures['played']?['total'] ?? 0) : (fixtures['played'] ?? 0);

          List<Map<String, String>> listStats = [
            {
              'name': 'Jogos Jogados',
              'game': '-',
              'total': totalPlayed.toString(),
              'rank': '-',
            },
            {
              'name': 'Gols Marcados',
              'game': (goals['for']?['average']?['total'] ?? goals['for']?['average'] ?? '0').toString(),
              'total': (goals['for']?['total']?['total'] ?? goals['for']?['total'] ?? '0').toString(),
              'rank': '-',
            },
            {
              'name': 'Gols Sofridos',
              'game': (goals['against']?['average']?['total'] ?? goals['against']?['average'] ?? '0').toString(),
              'total': (goals['against']?['total']?['total'] ?? goals['against']?['total'] ?? '0').toString(),
              'rank': '-',
            },
            {
              'name': 'Clean Sheets',
              'game': '-',
              'total': (data['clean_sheet']?['total'] ?? data['clean_sheet'] ?? '0').toString(),
              'rank': '-',
            },
            {
              'name': 'Vitórias',
              'game': '-',
              'total': (fixtures['wins']?['total'] ?? fixtures['wins'] ?? '0').toString(),
              'rank': '-',
            },
            {
              'name': 'Empates',
              'game': '-',
              'total': (fixtures['draws']?['total'] ?? fixtures['draws'] ?? '0').toString(),
              'rank': '-',
            },
            {
              'name': 'Derrotas',
              'game': '-',
              'total': (fixtures['loses']?['total'] ?? fixtures['loses'] ?? '0').toString(),
              'rank': '-',
            },
          ];

          return Container(
            width: context.width,
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              color: Theme.of(context).cardColor.withOpacity(0.8),
            ),
            margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: Column(
              children: [
                Table(
                  columnWidths: const {
                    0: FlexColumnWidth(4),
                    1: FlexColumnWidth(2),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(1),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(
                        border: Border(bottom: BorderSide(color: context.appColors.info ?? Colors.transparent, width: 1)),
                      ),
                      children: [
                        TableTileItem('ESTATÍSTICA', padding: EdgeInsets.only(bottom: 15)),
                        TableTileItem('Média', padding: EdgeInsets.only(bottom: 15), isCrossCenter: true),
                        TableTileItem('Total', padding: EdgeInsets.only(bottom: 15), isCrossCenter: true),
                        TableTileItem('Rank', padding: EdgeInsets.only(bottom: 15), isCrossCenter: true),
                      ],
                    ),
                    for (var stat in listStats)
                      TableRow(
                        decoration: BoxDecoration(
                          border: Border(bottom: BorderSide(color: context.appColors.info ?? Colors.transparent, width: 1)),
                        ),
                        children: [
                          TableTileItem(stat['name']!, padding: const EdgeInsets.symmetric(vertical: 15)),
                          TableTileItem(stat['game']!, padding: const EdgeInsets.symmetric(vertical: 15), isCrossCenter: true),
                          TableTileItem(stat['total']!, padding: const EdgeInsets.symmetric(vertical: 15), isCrossCenter: true),
                          TableTileItem(stat['rank']!, padding: const EdgeInsets.symmetric(vertical: 15), isCrossCenter: true),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          );
        }
        return const SizedBox();
      },
    );
  }
}
