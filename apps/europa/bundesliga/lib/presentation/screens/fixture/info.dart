part of '../screens.dart';

class InfoFixPage extends StatelessWidget {
  const InfoFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is FixtureLoaded) {
          return ListView(
            padding: const EdgeInsets.only(left: 10, right: 10, top: 0, bottom: 20),
            children: [
              CardBasicInfo(fixture: state.fixture),
            ],
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
