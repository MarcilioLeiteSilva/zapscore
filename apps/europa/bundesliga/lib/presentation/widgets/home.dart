part of 'widgets.dart';

Widget buildBlurFlexibleSpace() {
  return ClipRect(
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
      child: Container(
        color: Colors.transparent,
      ),
    ),
  );
}

class HomeNavBottom extends StatelessWidget {
  const HomeNavBottom({super.key, required this.index});
  final int index;

  @override
  Widget build(BuildContext context) {
    final navBgColor = (Theme.of(context).appBarTheme.backgroundColor ?? Theme.of(context).scaffoldBackgroundColor).withOpacity(0.50);

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          width: double.infinity,
          color: navBgColor,
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 60,
              child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Expanded(
                child: HomeTabBottomNavItem(
                  onTap: () {
                    context.read<SettingCubit>().updateHomeIndex(0);
                    if (GoRouter.of(context).canPop()) {
                      context.pop();
                    }
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
                    if (GoRouter.of(context).canPop()) {
                      context.pop();
                    }
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
                    if (GoRouter.of(context).canPop()) {
                      context.pop();
                    }
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
                    if (GoRouter.of(context).canPop()) {
                      context.pop();
                    }
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
                    if (GoRouter.of(context).canPop()) {
                      context.pop();
                    }
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
    final Color itemColor = selected
        ? Theme.of(context).primaryColor
        : const Color(0xFF454444);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SvgPicture.asset(
            selected ? solidIcon : icon,
            height: 22,
            colorFilter: ColorFilter.mode(itemColor, BlendMode.srcIn),
          ),
          const Gap(4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: context.textTheme.labelSmall!.copyWith(
              fontSize: 10,
              color: itemColor,
              fontWeight: selected ? FontWeight.bold : FontWeight.normal,
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
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: context.appColors.drawerHeader,
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(Assets.transparentIcon, width: 80),
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
            leading: const Icon(Icons.sports_soccer_outlined, color: Color(0xFFDD0000)),
            title: Text(
              'Rodadas',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(0);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.emoji_events_outlined, color: Color(0xFFDD0000)),
            title: Text(
              'Classificação',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(1);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.military_tech_outlined, color: Color(0xFFDD0000)),
            title: Text(
              'Artilharia',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              Navigator.pop(context);
              context.push('/$screenTopScorers');
            },
          ),
          ListTile(
            leading: const Icon(Icons.newspaper_outlined, color: Color(0xFFDD0000)),
            title: Text(
              'Notícias',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(2);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.play_circle_outline_rounded, color: Color(0xFFDD0000)),
            title: Text(
              'Vídeos',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(3);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.auto_awesome, color: Color(0xFFDD0000)),
            title: Text(
              'Palpites da IA',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              Navigator.pop(context);
              context.push('/$screenAiPerformance');
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined, color: Color(0xFFDD0000)),
            title: Text(
              'Configurações',
              style: GoogleFonts.urbanist(
                color: const Color(0xFF454444),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              context.read<SettingCubit>().updateHomeIndex(4);
              Navigator.pop(context);
            },
          ),
          const Gap(20),
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

class HomeAiPerformanceBanner extends StatefulWidget {
  const HomeAiPerformanceBanner({super.key});

  @override
  State<HomeAiPerformanceBanner> createState() => _HomeAiPerformanceBannerState();
}

class _HomeAiPerformanceBannerState extends State<HomeAiPerformanceBanner> {
  final ApiClient _apiClient = ApiClient();
  bool _loading = true;
  double? _accuracy;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final stats = await _apiClient.getAiPerformanceStats(leagueIds: '78,71', days: 7);
      if (mounted) {
        setState(() {
          _accuracy = stats.accuracyPercentage;
          _loading = false;
        });
      }
    } catch (e) {
      print('Error loading home AI banner stats: $e');
      if (mounted) {
        setState(() {
          _accuracy = null;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(height: 10);
    }
    
    if (_accuracy == null || _accuracy == 0) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final accentColor = theme.primaryColor;
    final infoColor = context.appColors.info ?? Colors.blue;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            context.push('/$screenAiPerformance');
          },
          borderRadius: BorderRadius.circular(15),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFBD9004),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: infoColor.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.auto_awesome,
                    color: accentColor,
                    size: 20,
                  ),
                ),
                const Gap(12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Desempenho da IA',
                        style: context.textTheme.bodySmall!.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                      const Gap(2),
                      Text(
                        'IA com ${_accuracy!.toStringAsFixed(1)}% de acertos nos últimos 7 dias!',
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const Gap(8),
                const Icon(
                  Icons.arrow_forward_ios,
                  color: Colors.white30,
                  size: 12,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
