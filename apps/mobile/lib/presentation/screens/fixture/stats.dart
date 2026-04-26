part of '../screens.dart';

class StatsFixPage extends StatelessWidget {
  const StatsFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is FixtureLoaded) {
          final fix = state.fixture;
          final homeId = fix.homeTeam!.externalId;
          final awayId = fix.awayTeam!.externalId;

          // Group stats by type
          final statTypes = fix.stats.map((s) => s.type).toSet().toList();

          if (statTypes.isEmpty) {
            return const Center(child: Text('Nenhuma estatística disponível'));
          }

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            children: [
              const Gap(20),
              Container(
                width: context.width,
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  color: AppColor.card,
                  border: Border.all(color: AppColor.info, width: 1),
                ),
                child: Column(
                  children: [
                    for (var i = 0; i < statTypes.length; i++) ...[
                      _buildStatRow(context, fix.stats, statTypes[i], homeId, awayId),
                      if (i < statTypes.length - 1) const Gap(15),
                    ],
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

  Widget _buildStatRow(BuildContext context, List<FixtureStat> stats, String type, int homeId, int awayId) {
    final homeStat = stats.firstWhere((s) => s.type == type && s.teamId == homeId, 
        orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';
    final awayStat = stats.firstWhere((s) => s.type == type && s.teamId == awayId, 
        orElse: () => FixtureStat(id: '', fixtureId: '', teamId: 0, type: '', value: '0')).value ?? '0';

    final homeVal = double.tryParse(homeStat.replaceAll('%', '')) ?? 0;
    final awayVal = double.tryParse(awayStat.replaceAll('%', '')) ?? 0;
    final total = homeVal + awayVal;
    
    // For possession, we use the value directly as percentage
    double homeFactor, awayFactor;
    if (type.toLowerCase().contains('possession')) {
      homeFactor = homeVal / 100;
      awayFactor = awayVal / 100;
    } else {
      homeFactor = total > 0 ? homeVal / total : 0.5;
      awayFactor = total > 0 ? awayVal / total : 0.5;
    }

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(homeStat, style: context.textTheme.bodySmall!.copyWith(fontSize: 15)),
            Text(type, style: context.textTheme.bodySmall!.copyWith(fontSize: 15)),
            Text(awayStat, style: context.textTheme.bodySmall!.copyWith(fontSize: 15)),
          ],
        ),
        const Gap(10),
        CardIndicatorEvent(homeValue: homeFactor, awayValue: awayFactor),
      ],
    );
  }
}
