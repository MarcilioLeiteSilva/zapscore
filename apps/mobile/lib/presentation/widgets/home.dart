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
            color: Theme.of(context).scaffoldBackgroundColor.withOpacity(.8),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: HomeTabBottomNavItem(
                  onTap: () {
                    context.read<SettingCubit>().updateHomeIndex(0);
                  },
                  selected: index == 0,
                  label: 'home'.tr(context),
                  icon: Assets.homeLine,
                  solidIcon: Assets.homeSolid,
                ),
              ),
              Expanded(
                child: HomeTabBottomNavItem(
                  onTap: () {
                    context.read<SettingCubit>().updateHomeIndex(1);
                  },
                  selected: index == 1,
                  label: 'favourite'.tr(context),
                  icon: Assets.star,
                  solidIcon: Assets.starSolid,
                ),
              ),
              Expanded(
                child: HomeTabBottomNavItem(
                  onTap: () {
                    context.read<SettingCubit>().updateHomeIndex(2);
                  },
                  selected: index == 2,
                  label: 'news'.tr(context),
                  icon: Assets.newsLine,
                  solidIcon: Assets.newsSolid,
                ),
              ),
              Expanded(
                child: HomeTabBottomNavItem(
                  onTap: () {
                    context.read<SettingCubit>().updateHomeIndex(3);
                  },
                  selected: index == 3,
                  label: 'watch'.tr(context),
                  icon: Assets.watchLine,
                  solidIcon: Assets.watchSolid,
                ),
              ),
              Expanded(
                child: HomeTabBottomNavItem(
                  onTap: () {
                    context.read<SettingCubit>().updateHomeIndex(4);
                  },
                  selected: index == 4,
                  label: 'account'.tr(context),
                  icon: Assets.accountLine,
                  solidIcon: Assets.accountSolid,
                ),
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SvgPicture.asset(
            selected ? solidIcon : icon,
            height: 22, // Fixado tamanho para evitar variações
            color: selected ? Theme.of(context).primaryColor : context.appColors.hint,
          ),
          const Gap(4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: context.textTheme.labelSmall!.copyWith(
              fontSize: 10, // Levemente menor para caber melhor
              color: selected ? Theme.of(context).primaryColor : context.appColors.hint,
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
      backgroundColor: context.appColors.drawerBackground,
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: context.appColors.drawerHeader,
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
            title: Text('competitions'.tr(context),
                style: const TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.newspaper_outlined, color: Colors.white),
            title: Text('news'.tr(context), style: const TextStyle(color: Colors.white)),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(2);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined, color: Colors.white),
            title: Text('account'.tr(context),
                style: const TextStyle(color: Colors.white)),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(4);
              Navigator.pop(context);
            },
          ),
          Divider(color: context.appColors.info, indent: 15, endIndent: 15),
          Padding(
            padding: const EdgeInsets.only(left: 15, top: 10, bottom: 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'redes_sociais'.tr(context),
                style: const TextStyle(color: Colors.white54, fontSize: 12),
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
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              '${'version'.tr(context)} 1.0.0',
              style: const TextStyle(color: Colors.white38, fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }
}
