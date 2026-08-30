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
    final navBgColor = Theme.of(context).appBarTheme.backgroundColor ??
        AppColor.appBarBackground.withOpacity(0.85);

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
        : Colors.white60;

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
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.sports_soccer_outlined, color: AppColor.accent),
            title: Text(
              'rounds'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              Navigator.pop(context);
              context.push(
                '/$screenLeague?initialIndex=1',
                extra: League(
                  id: AppConfig.leagueId,
                  externalId: AppConfig.externalLeagueId,
                  name: AppConfig.appName,
                  country: 'Brazil',
                  logo: AppConfig.defaultLeagueLogo,
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.emoji_events_outlined, color: AppColor.accent),
            title: Text(
              'table'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            onTap: () {
              Navigator.pop(context);
              context.push(
                '/$screenLeague?initialIndex=0',
                extra: League(
                  id: AppConfig.leagueId,
                  externalId: AppConfig.externalLeagueId,
                  name: AppConfig.appName,
                  country: 'Brazil',
                  logo: AppConfig.defaultLeagueLogo,
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.military_tech_outlined, color: AppColor.accent),
            title: Text(
              'top_scorers'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
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
            leading: const Icon(Icons.newspaper_outlined, color: AppColor.accent),
            title: Text(
              'news'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
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
            leading: const Icon(Icons.play_circle_outline_rounded, color: AppColor.accent),
            title: Text(
              'videos'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
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
            leading: const Icon(Icons.auto_awesome, color: AppColor.accent),
            title: Text(
              'ai_predictions'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
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
            leading: const Icon(Icons.settings_outlined, color: AppColor.accent),
            title: Text(
              'account'.tr(context),
              style: GoogleFonts.urbanist(
                color: Theme.of(context).colorScheme.onSurface,
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
      final stats = await _apiClient.getAiPerformanceStats(leagueId: AppConfig.externalLeagueId, days: 7);
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
            AdService.instance.showInterstitialAd(onAdClosed: () {
              context.push('/$screenAiPerformance');
            });
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
                        'ai_performance_title'.tr(context),
                        style: context.textTheme.bodySmall!.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                      const Gap(2),
                      Text(
                        'ai_banner_accuracy'.tr(context).replaceAll('{acc}', _accuracy!.toStringAsFixed(1)),
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

class HomeNewsCarouselSection extends StatelessWidget {
  const HomeNewsCarouselSection({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NewsCubit, NewsState>(
      builder: (context, state) {
        if (state is NewsLoaded && state.news.isNotEmpty) {
          final carouselNews = state.news.take(5).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'news'.tr(context),
                      style: context.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        context.read<SettingCubit>().updateHomeIndex(2);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
                        child: Text(
                          'see_all_female'.tr(context),
                          style: context.textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Gap(6),
              SizedBox(
                width: context.width,
                height: 135,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemBuilder: (_, i) {
                    return CardNewsCarouselItem(
                      news: carouselNews[i],
                      onlyThumb: true,
                    );
                  },
                  separatorBuilder: (_, i) => const Gap(10),
                  itemCount: carouselNews.length,
                ),
              ),
            ],
          );
        }
        return const SizedBox.shrink();
      },
    );
  }
}

class HomeVideoCarouselSection extends StatelessWidget {
  const HomeVideoCarouselSection({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<VideoCubit, VideoState>(
      builder: (context, state) {
        if (state is VideoLoaded && state.videos.isNotEmpty) {
          final carouselVideos = state.videos.take(5).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'watch'.tr(context),
                      style: context.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        context.read<SettingCubit>().updateHomeIndex(3);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
                        child: Text(
                          'see_all_male'.tr(context),
                          style: context.textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Gap(6),
              SizedBox(
                width: context.width,
                height: 135,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemBuilder: (_, i) {
                    return CardNewsCarouselItem(
                      isVideo: true,
                      video: carouselVideos[i],
                      onlyThumb: true,
                    );
                  },
                  separatorBuilder: (_, i) => const Gap(10),
                  itemCount: carouselVideos.length,
                ),
              ),
            ],
          );
        }
        return const SizedBox.shrink();
      },
    );
  }
}

