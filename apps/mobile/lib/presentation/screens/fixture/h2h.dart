part of '../screens.dart';

class H2hFixPage extends StatelessWidget {
  const H2hFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      children: [
        const Gap(20),
        const CardOverallLastFive(),
        const Gap(20),
        ListView.separated(
          shrinkWrap: true,
          physics: const ScrollPhysics(),
          padding: EdgeInsets.zero,
          itemBuilder: (_, i) {
            return CardGroupFixtureItem();
          },
          separatorBuilder: (_, i) => const Gap(20),
          itemCount: 5,
        ),
      ],
    );
  }
}

class CardOverallLastFive extends StatelessWidget {
  const CardOverallLastFive({super.key});

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
                "${'wins'.tr(context)} 24",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'draws'.tr(context)} 9",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'wins'.tr(context)} 16",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
            ],
          ),
          const Gap(15),
          const CardIndicatorThreeH2H(),
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
                "${'wins'.tr(context)} 2",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'draws'.tr(context)} 0",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
              Text(
                "${'wins'.tr(context)} 3",
                style: context.textTheme.bodySmall!.copyWith(fontSize: 15),
              ),
            ],
          ),
          const Gap(15),
          const CardIndicatorThreeH2H(hideMid: true),
        ],
      ),
    );
  }
}
