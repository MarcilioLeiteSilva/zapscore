part of 'widgets.dart';

class HomeNavBottom extends StatelessWidget {
  const HomeNavBottom({super.key, required this.index});
  final int index;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: Container(
          height: 80,
          padding: const EdgeInsets.symmetric(horizontal: 15),
          decoration: BoxDecoration(
            color: AppColor.background.withOpacity(.7),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              HomeTabBottomNavItem(
                onTap: () {
                  context.read<SettingCubit>().updateHomeIndex(0);
                },
                selected: index == 0,
                label: 'Home',
                icon: Assets.homeLine,
                solidIcon: Assets.homeSolid,
              ),
              HomeTabBottomNavItem(
                onTap: () {
                  context.read<SettingCubit>().updateHomeIndex(1);
                },
                selected: index == 1,
                label: 'Favorites',
                icon: Assets.star,
                solidIcon: Assets.starSolid,
              ),
              HomeTabBottomNavItem(
                onTap: () {
                  context.read<SettingCubit>().updateHomeIndex(2);
                },
                selected: index == 2,
                label: 'News',
                icon: Assets.newsLine,
                solidIcon: Assets.newsSolid,
              ),
              HomeTabBottomNavItem(
                onTap: () {
                  context.read<SettingCubit>().updateHomeIndex(3);
                },
                selected: index == 3,
                label: 'Watch',
                icon: Assets.watchLine,
                solidIcon: Assets.watchSolid,
              ),
              HomeTabBottomNavItem(
                onTap: () {
                  context.read<SettingCubit>().updateHomeIndex(4);
                },
                selected: index == 4,
                label: 'Account',
                icon: Assets.accountLine,
                solidIcon: Assets.accountSolid,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeTabBottomNavItem extends StatelessWidget {
  const HomeTabBottomNavItem(
      {super.key,
      required this.selected,
      required this.label,
      required this.icon,
      required this.onTap,
      required this.solidIcon});
  final bool selected;
  final String label, icon, solidIcon;
  final Function() onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      icon: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          SvgPicture.asset(
            selected ? solidIcon : icon,
            color: selected ? AppColor.primary : AppColor.hint,
          ),
          Text(
            label,
            style: context.textTheme.labelSmall!.copyWith(
              color: selected ? AppColor.primary : AppColor.hint,
            ),
          ),
        ],
      ),
    );
  }
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColor.background,
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: AppColor.primary,
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(Assets.appIcon, width: 60),
                  const Gap(10),
                  Text(
                    AppText.appName,
                    style: context.textTheme.headlineSmall!.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          ListTile(
            leading:
                const Icon(Icons.emoji_events_outlined, color: Colors.white),
            title: const Text('Competições',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.newspaper_outlined, color: Colors.white),
            title: const Text('Notícias', style: TextStyle(color: Colors.white)),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(2);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined, color: Colors.white),
            title: const Text('Configurações',
                style: TextStyle(color: Colors.white)),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(4);
              Navigator.pop(context);
            },
          ),
          const Divider(color: AppColor.info, indent: 15, endIndent: 15),
          const Padding(
            padding: EdgeInsets.only(left: 15, top: 10, bottom: 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Redes sociais',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ),
          ),
          ListTile(
            leading: const FaIcon(FontAwesomeIcons.instagram,
                color: Colors.white, size: 20),
            title:
                const Text('Instagram', style: TextStyle(color: Colors.white)),
            onTap: () {},
          ),
          ListTile(
            leading: const FaIcon(FontAwesomeIcons.facebook,
                color: Colors.white, size: 20),
            title: const Text('Facebook', style: TextStyle(color: Colors.white)),
            onTap: () {},
          ),
          ListTile(
            leading: const FaIcon(FontAwesomeIcons.twitter,
                color: Colors.white, size: 20),
            title: const Text('X', style: TextStyle(color: Colors.white)),
            onTap: () {},
          ),
          const Spacer(),
          const Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              'Version 1.0.0',
              style: TextStyle(color: Colors.white38, fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }
}
