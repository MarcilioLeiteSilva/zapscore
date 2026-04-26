part of '../screens.dart';

class TableFixPage extends StatelessWidget {
  const TableFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
      children: [
        const Gap(15),
        Container(
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
          child: Table(
            columnWidths: const {
              0: FlexColumnWidth(1),
              1: FlexColumnWidth(4),
              2: FlexColumnWidth(1),
              3: FlexColumnWidth(1),
              4: FlexColumnWidth(1),
            },
            children: [
              const TableRow(
                decoration: BoxDecoration(
                  border: Border(
                      bottom: BorderSide(
                    color: AppColor.info,
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
                    'TEAM',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                  TableTileItem(
                    'P',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                  TableTileItem(
                    'GD',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                  TableTileItem(
                    'PTS',
                    padding: EdgeInsets.only(bottom: 15),
                  ),
                ],
              ),
              for (int i = 0; i < 15; i++)
                TableRow(
                  decoration: const BoxDecoration(
                    border: Border(
                        bottom: BorderSide(
                      color: AppColor.info,
                      width: 1,
                    )),
                  ),
                  children: [
                    TableTileItem(
                      '${i + 1}',
                      isTop: [0, 1, 2].contains(i),
                      isCrossCenter: true,
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 13),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 30,
                            height: 30,
                            child: CardNoImage(radius: 5),
                          ),
                          Gap(10),
                          Expanded(
                            child: Text('TEAM', style: TextStyle(fontSize: 15)),
                          ),
                        ],
                      ),
                    ),
                    const TableTileItem('14'),
                    const TableTileItem('22'),
                    const TableTileItem('27'),
                  ],
                ),
            ],
          ),
        ),
      ],
    );
  }
}
