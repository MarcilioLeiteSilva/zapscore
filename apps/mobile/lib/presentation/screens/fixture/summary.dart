part of '../screens.dart';

class SummaryFixPage extends StatelessWidget {
  const SummaryFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is FixtureLoaded) {
          final fix = state.fixture;
          
          final possessionHome = fix.stats.firstWhere((s) => s.type == 'Possession' && s.teamId == fix.homeTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '50%')).value ?? '50%';
          final possessionAway = fix.stats.firstWhere((s) => s.type == 'Possession' && s.teamId == fix.awayTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '50%')).value ?? '50%';
          
          final posHomeVal = double.tryParse(possessionHome.replaceAll('%', '')) ?? 50;
          final posAwayVal = double.tryParse(possessionAway.replaceAll('%', '')) ?? 50;

          final cornersHome = fix.stats.firstWhere((s) => s.type == 'Corner Kicks' && s.teamId == fix.homeTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';
          final cornersAway = fix.stats.firstWhere((s) => s.type == 'Corner Kicks' && s.teamId == fix.awayTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';

          final yellowHome = fix.stats.firstWhere((s) => s.type == 'Yellow Cards' && s.teamId == fix.homeTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';
          final yellowAway = fix.stats.firstWhere((s) => s.type == 'Yellow Cards' && s.teamId == fix.awayTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';

          final shotsHome = fix.stats.firstWhere((s) => s.type == 'Total Shots' && s.teamId == fix.homeTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';
          final shotsAway = fix.stats.firstWhere((s) => s.type == 'Total Shots' && s.teamId == fix.awayTeam!.externalId, orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            children: [
              const Gap(20),
              CardEventMatch(
                events: fix.events,
                homeTeamId: fix.homeTeam!.externalId,
                awayTeamId: fix.awayTeam!.externalId,
              ),
              const Gap(20),
              Container(
                width: context.width,
                padding: const EdgeInsets.symmetric(
                  horizontal: 15,
                  vertical: 15,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  color: Theme.of(context).cardColor,
                  border: Border.all(color: AppColor.info, width: 1),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          possessionHome,
                          style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                        ),
                        Text(
                          "Possession (%)",
                          style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                        ),
                        Text(
                          possessionAway,
                          style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
                        ),
                      ],
                    ),
                    const Gap(15),
                    CardIndicatorEvent(
                      homeValue: posHomeVal / 100,
                      awayValue: posAwayVal / 100,
                    ),
                    const Gap(20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        CardEventPossession(
                          icon: Assets.bara,
                          homeValue: shotsHome,
                          awayValue: shotsAway,
                        ),
                        const Gap(10),
                        CardEventPossession(
                          icon: Assets.corner,
                          homeValue: cornersHome,
                          awayValue: cornersAway,
                        ),
                        const Gap(10),
                        CardEventPossession(
                          icon: Assets.yellowCard,
                          homeValue: yellowHome,
                          awayValue: yellowAway,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Gap(50),
            ],
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
