part of 'widgets.dart';

class MatchTeamPage extends StatelessWidget {
  const MatchTeamPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const ScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      itemBuilder: (_, i) {
        return CardGroupFixtureItem();
      },
      separatorBuilder: (_, i) => const Gap(20),
      itemCount: 3,
    );
  }
}

class TeamOverview extends StatelessWidget {
  const TeamOverview({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 10),
      children: [
        CardFixtureDetail(),
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
            color: AppColor.card,
            border: Border.all(
              color: AppColor.info,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 10),
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            padding: EdgeInsets.zero,
            itemBuilder: (_, i) {
              return CardTopScores(rank: i + 1);
            },
            separatorBuilder: (_, i) => const Divider(height: 30),
            itemCount: 5,
          ),
        ),
        const Gap(50),
      ],
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
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
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

class TeamStatePage extends StatelessWidget {
  const TeamStatePage({super.key});

  @override
  Widget build(BuildContext context) {
    var columnWidths = const {
      0: FlexColumnWidth(4),
      1: FlexColumnWidth(2),
      2: FlexColumnWidth(1),
      3: FlexColumnWidth(1),
    };
    var decoration = const BoxDecoration(
      border: Border(
          bottom: BorderSide(
        color: AppColor.info,
        width: 1,
      )),
    );

    List<Map<String, String>> listStats = [
      {
        'name': 'Average ball poss',
        'game': '1',
        'total': '60.2%',
        'rank': '3',
      },
      {
        'name': 'Goals scored',
        'game': '2.5',
        'total': '35',
        'rank': '2',
      },
      {
        'name': 'Goals scored first',
        'game': '1',
        'total': '14',
        'rank': '3',
      },
      {
        'name': 'Goals scored second',
        'game': '1.4',
        'total': '20',
        'rank': '3',
      },
      {
        'name': 'Goals by head',
        'game': '0.45',
        'total': '5',
        'rank': '4',
      },
      {
        'name': 'Goals by foot',
        'game': '1.8',
        'total': '29',
        'rank': '2',
      },
      {
        'name': 'Goals by head',
        'game': '0.45',
        'total': '5',
        'rank': '4',
      },
      {
        'name': 'Penalties missed',
        'game': '0',
        'total': '0',
        'rank': '8',
      },
      {
        'name': 'Shots',
        'game': '12.5',
        'total': '194',
        'rank': '5',
      },
      {
        'name': 'Shots on target',
        'game': '5.4',
        'total': '76',
        'rank': '5',
      },
      {
        'name': 'Shots off target',
        'game': '5.4',
        'total': '76',
        'rank': '4',
      },
      {
        'name': 'Shots on bar',
        'game': '0',
        'total': '0',
        'rank': '19',
      },
      {
        'name': 'Shots on post',
        'game': '0.08',
        'total': '1',
        'rank': '7',
      },
      {
        'name': 'Offsides',
        'game': '1.3',
        'total': '16',
        'rank': '16',
      },
    ];

    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 15,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      child: Column(
        children: [
          Table(
            columnWidths: columnWidths,
            children: [
              TableRow(
                decoration: decoration,
                children: const [
                  TableTileItem(
                    'ATTACKING',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                  TableTileItem(
                    'Per Game',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                  TableTileItem(
                    'Total',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                  TableTileItem(
                    'Rank',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                ],
              ),
            ],
          ),
          Expanded(
            child: ListView(
              children: [
                Table(
                  columnWidths: columnWidths,
                  children: [
                    for (int i = 0; i < listStats.length; i++)
                      TableRow(
                        decoration: decoration,
                        children: [
                          TableTileItem(
                            listStats[i]['name']!,
                            padding: const EdgeInsets.only(bottom: 15, top: 15),
                          ),
                          TableTileItem(
                            listStats[i]['game']!,
                            padding: const EdgeInsets.only(bottom: 15, top: 15),
                            isCrossCenter: true,
                          ),
                          TableTileItem(
                            listStats[i]['total']!,
                            padding: const EdgeInsets.only(bottom: 15, top: 15),
                            isCrossCenter: true,
                          ),
                          TableTileItem(
                            listStats[i]['rank']!,
                            padding: const EdgeInsets.only(bottom: 15, top: 15),
                            isCrossCenter: true,
                          ),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
