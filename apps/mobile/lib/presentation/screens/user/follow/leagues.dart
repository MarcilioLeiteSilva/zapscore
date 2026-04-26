part of '../../screens.dart';

class FollowLeague extends StatelessWidget {
  const FollowLeague({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Follow Competitions',
            style: context.textTheme.headlineMedium,
          ),
          const Gap(5),
          Text(
            'Pick a few competitions fo follow. It will been seen later on your favorite tab page.',
            style: context.textTheme.bodySmall,
          ),
          const Gap(20),
          const CardSearchFollow(label: 'Search Competitions'),
          const Gap(20),
          Expanded(
            child: Ink(
              decoration: BoxDecoration(
                color: AppColor.card,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
                border: Border.all(color: AppColor.info, width: 1),
              ),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 10),
                itemBuilder: (_, i) {
                  return const CardFollowItem();
                },
                separatorBuilder: (_, i) => const Divider(
                  endIndent: 20,
                  indent: 20,
                ),
                itemCount: 5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
