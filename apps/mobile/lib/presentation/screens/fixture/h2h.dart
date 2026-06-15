part of '../screens.dart';

class H2hFixPage extends StatelessWidget {
  const H2hFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is FixtureLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (state is! FixtureLoaded) {
          return const Center(child: Text('Erro ao carregar detalhes do jogo'));
        }

        final h2h = state.h2hData;
        if (h2h == null || h2h['matches'] == null) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('Nenhum confronto direto disponível'),
            ),
          );
        }

        final stats = h2h['statistics'];
        final overall = (stats?['overall'] as Map?)?.cast<String, dynamic>() ?? {};
        final last5 = (stats?['last5'] as Map?)?.cast<String, dynamic>() ?? {};
        final List<dynamic> matchesJson = h2h['matches'] ?? [];

        // Mapeia matchesJson para instâncias de Fixture
        final List<Fixture> fixtures = matchesJson
            .map((item) => Fixture.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();

        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          children: [
            const Gap(20),
            CardOverallLastFive(overall: overall, last5: last5),
            const Gap(20),
            Text(
              'matches'.tr(context).toUpperCase(),
              style: context.textTheme.bodySmall!.copyWith(fontWeight: FontWeight.bold),
            ),
            const Gap(10),
            if (fixtures.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Text('Sem histórico de confrontos recentes'),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: EdgeInsets.zero,
                itemBuilder: (_, i) {
                  return CardFixtureItem(
                    fixture: fixtures[i],
                    showDivider: false,
                  );
                },
                separatorBuilder: (_, i) => const Gap(10),
                itemCount: fixtures.length,
              ),
            const Gap(30),
          ],
        );
      },
    );
  }
}

class CardOverallLastFive extends StatelessWidget {
  const CardOverallLastFive({super.key, required this.overall, required this.last5});
  final Map<String, dynamic> overall;
  final Map<String, dynamic> last5;

  @override
  Widget build(BuildContext context) {
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
      child: Column(
        children: [
          Text(
            'overall'.tr(context),
            style: context.textTheme.bodySmall,
          ),
          const Divider(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "${'wins'.tr(context)} ${overall['homeWins'] ?? 0}",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'draws'.tr(context)} ${overall['draws'] ?? 0}",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'wins'.tr(context)} ${overall['awayWins'] ?? 0}",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
            ],
          ),
          const Gap(15),
          CardIndicatorThreeH2H(
            homeWins: toInt(overall['homeWins']),
            draws: toInt(overall['draws']),
            awayWins: toInt(overall['awayWins']),
          ),
          const Divider(height: 30),
          Text(
            'last_5'.tr(context),
            style: context.textTheme.bodySmall,
          ),
          const Divider(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "${'wins'.tr(context)} ${last5['homeWins'] ?? 0}",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'draws'.tr(context)} ${last5['draws'] ?? 0}",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'wins'.tr(context)} ${last5['awayWins'] ?? 0}",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
            ],
          ),
          const Gap(15),
          CardIndicatorThreeH2H(
            homeWins: toInt(last5['homeWins']),
            draws: toInt(last5['draws']),
            awayWins: toInt(last5['awayWins']),
            hideMid: true,
          ),
        ],
      ),
    );
  }
}
