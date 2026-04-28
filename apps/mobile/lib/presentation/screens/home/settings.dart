part of '../screens.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Text('account'.tr(context)),
        centerTitle: false,
      ),
      body: ListView(
        children: [
          const Gap(10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                const SizedBox(
                  width: 65,
                  height: 65,
                  child: CardNoImage(radius: 100),
                ),
                const Gap(10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('User Profile'), // Placeholder standard
                      Text(
                        'user@zapscore.com',
                        style: context.textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {},
                  icon: SvgPicture.asset(
                    Assets.edit,
                    color: context.watch<SettingCubit>().state.theme == 'white' ? Colors.grey[800] : Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const Gap(10),
          const Divider(height: 30, endIndent: 10, indent: 10),
          CardSettingItem(
            label: 'profile'.tr(context),
            icon: Assets.accountLine,
            color: Colors.orange.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenEditInfo);
            },
          ),
          CardSettingItem(
            label: 'theme'.tr(context),
            icon: Assets.eye,
            color: Colors.blue.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenTheme);
            },
          ),
          CardSettingItem(
            label: 'notifications'.tr(context),
            icon: Assets.bell,
            color: Colors.deepPurple.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenEditNotification);
            },
          ),
          CardSettingItem(
            label: 'general'.tr(context),
            icon: Assets.general,
            color: Colors.pinkAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenGeneral);
            },
          ),
          CardSettingItem(
            label: 'about'.tr(context),
            icon: Assets.info,
            color: Colors.deepPurpleAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenAbout);
            },
          ),
          CardSettingItem(
            label: 'logout'.tr(context),
            icon: Assets.logout,
            color: context.appColors.logout?.withOpacity(.1) ?? Colors.red.withOpacity(.1),
            fullColor: context.appColors.logout,
            onTap: () {
              showModalBottomSheet(
                  context: context, builder: (builder) => const SheetLogOut());
            },
          ),
        ],
      ),
    );
  }
}
