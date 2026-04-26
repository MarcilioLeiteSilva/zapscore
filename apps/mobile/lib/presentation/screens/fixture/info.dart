part of '../screens.dart';

class InfoFixPage extends StatelessWidget {
  const InfoFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is FixtureLoaded) {
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
            children: [
              CardBasicInfo(fixture: state.fixture),
              const Gap(15),
              Text(
                'Form',
                style: context.textTheme.headlineSmall!.copyWith(
                  fontSize: 18,
                ),
              ),
              const Gap(15),
              const CardFormInfoFixture(),
            ],
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
