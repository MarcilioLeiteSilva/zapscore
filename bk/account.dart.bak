part of '../screens.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Text('Account'),
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () {},
            icon: SvgPicture.asset(Assets.more),
          ),
        ],
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
                      const Text('Mouad Zizi'),
                      Text(
                        'moad.devloper@gmail.com',
                        style: context.textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {},
                  icon: SvgPicture.asset(Assets.edit),
                ),
              ],
            ),
          ),
          const Gap(10),
          const Divider(height: 30, endIndent: 10, indent: 10),
          CardSettingItem(
            label: 'Personal Info',
            icon: Assets.accountSetting,
            color: Colors.orange.withOpacity(.2),
            onTap: () {
              context.pushNamed(screenEditInfo);
            },
          ),
          CardSettingItem(
            label: 'Notification',
            icon: Assets.bellSetting,
            color: Colors.deepPurple.withOpacity(.2),
            onTap: () {
              context.pushNamed(screenEditNotification);
            },
          ),
          CardSettingItem(
            label: 'General',
            icon: Assets.general,
            color: Colors.pinkAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenGeneral);
            },
          ),
          CardSettingItem(
            label: 'Security',
            icon: Assets.securite,
            color: Colors.greenAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenSecurity);
            },
          ),
          /*   CardSettingItem(
            label: 'Dark Mode',
            icon: Assets.eye,
            color: Colors.blue.withOpacity(.1),
            onTap: () {},
          ),*/
          CardSettingItem(
            label: 'Help Center',
            icon: Assets.help,
            color: Colors.orange.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenHelpCenter);
            },
          ),
          CardSettingItem(
            label: 'About ${AppText.appName}',
            icon: Assets.info,
            color: Colors.deepPurpleAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenAbout);
            },
          ),
          CardSettingItem(
            label: 'Logout',
            icon: Assets.logout,
            color: AppColor.logout.withOpacity(.1),
            fullColor: AppColor.logout,
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
