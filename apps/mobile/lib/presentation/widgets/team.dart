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
          final rawStats = state.stats;
          Map<String, dynamic> data = rawStats ?? {};
          if (data.containsKey('response') && data['response'] is Map) {
            data = data['response'];
          }
          final formString = data['form']?.toString() ?? '';
          final lastMatch = state.fixtures.isNotEmpty ? state.fixtures.first : null;

          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 10),
            children: [
              if (lastMatch != null) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    'recent_match'.tr(context),
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
                  'form'.tr(context),
                  style: context.textTheme.headlineSmall!.copyWith(
                    fontSize: 18,
                  ),
                ),
              ),
              const Gap(15),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: CardFormInfoTeam(form: formString),
              ),
              const Gap(20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'top_scorers'.tr(context),
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
                child: Center(child: Text('coming_soon'.tr(context))),
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
  const CardFormInfoTeam({super.key, required this.form});
  final String form;

  @override
  Widget build(BuildContext context) {
    // Pegar os últimos 5 resultados (se houver)
    final List<String> forms = form.split('').reversed.take(5).toList().reversed.toList();
    
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
                  'last_5'.tr(context),
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                if (forms.isEmpty)
                  Text(
                    'Nenhum dado',
                    style: context.textTheme.labelSmall,
                  )
                else
                  for (var f in forms)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: CircleAvatar(
                        radius: 12,
                        backgroundColor: _getFormColor(f),
                        child: Text(
                          f.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.white,
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
            child: BlocBuilder<TeamCubit, TeamState>(
              builder: (context, state) {
                if (state is TeamLoaded) {
                  final fixtures = state.fixtures.take(5).toList();
                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    scrollDirection: Axis.horizontal,
                    itemCount: fixtures.length,
                    itemBuilder: (_, i) {
                      return CardFormMatch(fixture: fixtures[i]);
                    },
                    separatorBuilder: (_, i) => const Gap(10),
                  );
                }
                return const SizedBox();
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _getFormColor(String f) {
    switch (f.toUpperCase()) {
      case 'W':
        return Colors.green;
      case 'D':
        return Colors.grey;
      case 'L':
        return Colors.red;
      default:
        return Colors.grey.withOpacity(0.3);
    }
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
            return Center(child: Text('no_stats'.tr(context)));
          }

          Map<String, dynamic> data = rawStats;
          if (data.containsKey('response') && data['response'] is Map) {
            data = data['response'];
          }

          final fixtures = data['fixtures'] is Map ? data['fixtures'] : {};
          final goals = data['goals'] is Map ? data['goals'] : {};
          final totalPlayed = fixtures['played'] is Map ? (fixtures['played']?['total'] ?? 0) : (fixtures['played'] ?? 0);

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
            children: [
              if (state.leagueName != null)
                Padding(
                  padding: const EdgeInsets.only(left: 5, bottom: 20),
                  child: Text(
                    state.leagueName!,
                    style: context.textTheme.headlineSmall!.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              _buildStatCategory(
                context,
                title: 'general'.tr(context),
                stats: [
                  {'label': 'matches_played'.tr(context), 'value': totalPlayed.toString()},
                  {'label': 'wins'.tr(context), 'value': (fixtures['wins']?['total'] ?? fixtures['wins'] ?? '0').toString()},
                  {'label': 'draws'.tr(context), 'value': (fixtures['draws']?['total'] ?? fixtures['draws'] ?? '0').toString()},
                  {'label': 'losses'.tr(context), 'value': (fixtures['loses']?['total'] ?? fixtures['loses'] ?? '0').toString()},
                ],
              ),
              const Gap(20),
              _buildStatCategory(
                context,
                title: 'goals'.tr(context),
                stats: [
                  {
                    'label': 'goals_scored'.tr(context), 
                    'value': (goals['for']?['total']?['total'] ?? goals['for']?['total'] ?? '0').toString(),
                    'sub': '${'average'.tr(context)}: ${goals['for']?['average']?['total'] ?? goals['for']?['average'] ?? '0'}'
                  },
                  {
                    'label': 'goals_conceded'.tr(context), 
                    'value': (goals['against']?['total']?['total'] ?? goals['against']?['total'] ?? '0').toString(),
                    'sub': '${'average'.tr(context)}: ${goals['against']?['average']?['total'] ?? goals['against']?['average'] ?? '0'}'
                  },
                  {'label': 'clean_sheets'.tr(context), 'value': (data['clean_sheet']?['total'] ?? data['clean_sheet'] ?? '0').toString()},
                  {'label': 'failed_to_score'.tr(context), 'value': (data['failed_to_score']?['total'] ?? data['failed_to_score'] ?? '0').toString()},
                ],
              ),
              const Gap(20),
              _buildStatCategory(
                context,
                title: 'performance'.tr(context),
                stats: [
                  {
                    'label': 'avg_possession'.tr(context), 
                    'value': data['average_possession'] != null ? '${data['average_possession']}%' : '-'
                  },
                  {
                    'label': 'avg_shots'.tr(context), 
                    'value': data['average_shots']?.toString() ?? '-'
                  },
                ],
              ),
              const Gap(50),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }

  Widget _buildStatCategory(BuildContext context, {required String title, required List<Map<String, String>> stats}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 10),
          child: Text(
            title.toUpperCase(),
            style: context.textTheme.labelSmall!.copyWith(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor.withOpacity(0.8),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(
            children: stats.asMap().entries.map((entry) {
              final i = entry.key;
              final stat = entry.value;
              return Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  border: i == stats.length - 1
                      ? null
                      : Border(bottom: BorderSide(color: context.appColors.info!.withOpacity(0.2))),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(stat['label']!, style: context.textTheme.bodySmall),
                        if (stat['sub'] != null)
                          Text(stat['sub']!, style: context.textTheme.labelSmall!.copyWith(color: Colors.white54)),
                      ],
                    ),
                    Text(
                      stat['value']!,
                      style: context.textTheme.bodyMedium!.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
class TeamNewsPage extends StatelessWidget {
  final String teamId;
  final int? leagueId;
  const TeamNewsPage({super.key, required this.teamId, this.leagueId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => NewsCubit(context.read<HomeCubit>().apiClient)
        ..fetchNews(teamId: teamId),
      child: BlocBuilder<NewsCubit, NewsState>(
        builder: (context, state) {
          if (state is NewsLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is NewsError) {
            return Center(child: Text(state.message));
          }
          if (state is NewsLoaded) {
            if (state.news.isEmpty) {
              return Center(child: Text('no_news'.tr(context)));
            }
            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              itemBuilder: (_, i) {
                return CardNewsItem(news: state.news[i]);
              },
              separatorBuilder: (_, i) => const Gap(15),
              itemCount: state.news.length,
            );
          }
          return const SizedBox();
        },
      ),
    );
  }
}
