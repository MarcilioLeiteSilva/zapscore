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
                child: [
                  const FixturePage(),
                  const FavoritePage(),
                  const NewsPage(),
                  const WatchPage(),
                  const SettingsPage(),
                ][state.homeIndex],
              ),
              Positioned(
                bottom: 10,
                left: 10,
                right: 10,
                child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const AdBannerWidget(margin: EdgeInsets.only(bottom: 6)),
                      HomeNavBottom(index: state.homeIndex),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
