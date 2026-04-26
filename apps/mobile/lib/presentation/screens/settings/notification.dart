part of '../screens.dart';

class EditNotifScreen extends StatelessWidget {
  const EditNotifScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        children: [
          CardTileSwitch(
            label: 'Match Alert',
            value: true,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'Featured News',
            value: false,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'Featured Video',
            value: true,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'Streaming',
            value: false,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'Promotions',
            value: true,
            onChange: (value) {},
          ),
          CardTileSwitch(
            label: 'App Updates',
            value: true,
            onChange: (value) {},
          ),
          const Gap(20),
          Ink(
            width: context.width,
            decoration: BoxDecoration(
              color: AppColor.card,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(10),
                topRight: Radius.circular(10),
              ),
              border: Border.all(color: AppColor.info, width: 1),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(15),
                  child: Row(
                    children: [
                      Text(
                        'Teams',
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
                ListView.separated(
                  shrinkWrap: true,
                  physics: const ScrollPhysics(),
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
              ],
            ),
          ),
        ],
      ),
    );
  }
}
