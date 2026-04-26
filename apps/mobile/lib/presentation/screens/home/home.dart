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
                padding: const EdgeInsets.only(bottom: 90),
                child: [
                  const FixturePage(),
                  const FavoritePage(),
                  const NewsPage(),
                  const WatchPage(),
                  const AccountPage(),
                ][state.homeIndex],
              ),
              Positioned(
                bottom: 20,
                left: 10,
                right: 10,
                child: SafeArea(
                  child: HomeNavBottom(index: state.homeIndex),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
