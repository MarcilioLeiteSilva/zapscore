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
                padding: EdgeInsets.zero,
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
                child: HomeNavBottom(index: state.homeIndex),
              ),
            ],
          );
        },
      ),
    );
  }
}
