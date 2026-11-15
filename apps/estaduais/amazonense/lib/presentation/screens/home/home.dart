part of '../screens.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
                child: IndexedStack(
                  index: state.homeIndex,
                  children: const [
                    FixturePage(),
                    FavoritePage(),
                    NewsPage(),
                    WatchPage(),
                    SettingsPage(),
                  ],
                ),
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
