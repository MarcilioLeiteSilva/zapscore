part of '../../screens.dart';

class FollowNotification extends StatelessWidget {
  const FollowNotification({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Set Notifications',
            style: context.textTheme.headlineMedium,
          ),
          const Gap(5),
          Text(
            'Choose the team notification you want.',
            style: context.textTheme.bodySmall,
          ),
          const Gap(20),
          const CardSearchFollow(label: 'Search Teams'),
          const Gap(20),
          Expanded(
            child: Ink(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
                border: Border.all(color: context.appColors.info ?? Colors.transparent, width: 1),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(15),
                    child: Row(
                      children: [
                        Text(
                          'Notification Type',
                          style: context.textTheme.bodySmall,
                        ),
                        const Spacer(),
                        Text(
                          'Match',
                          style: context.textTheme.bodySmall,
                        ),
                        const Gap(10),
                        Text(
                          'News',
                          style: context.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 0),
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      itemBuilder: (_, i) {
                        return CardFollowItem(
                          onNotif: (value) {},
                        );
                      },
                      separatorBuilder: (_, i) => const Divider(
                        endIndent: 20,
                        indent: 20,
                      ),
                      itemCount: 5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
