part of '../screens.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      HousePopupLaunchHelper.checkAndShow(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<SettingCubit, SettingState>(
        builder: (context, state) {
          return Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 145),
                child: [
                  const FixturePage(),
                  const FavoritePage(),
                  const NewsPage(),
                  const WatchPage(),
                  const SettingsPage(),
                ][state.homeIndex],
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const AdBannerWidget(),
                    HomeNavBottom(index: state.homeIndex),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
