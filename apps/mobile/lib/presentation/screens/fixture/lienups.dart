part of '../screens.dart';

class LineupsFixPage extends StatelessWidget {
  const LineupsFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FixtureCubit, FixtureState>(
      builder: (context, state) {
        if (state is FixtureLoaded) {
          final fix = state.fixture;
          final homeSubstitutes = fix.lineups.where((l) => l.teamId == fix.homeTeam?.externalId && !l.isStart).toList();
          final awaySubstitutes = fix.lineups.where((l) => l.teamId == fix.awayTeam?.externalId && !l.isStart).toList();
          final substEvents = fix.events.where((e) => e.type.toLowerCase() == 'subst').toList();

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
            children: [
              const Gap(20),
              CardLineup(fixture: fix),
              const Gap(15),
              CardSubstitution(substEvents: substEvents, homeTeamId: fix.homeTeam!.externalId),
              const Gap(15),
              CardSubstitutionPlayers(substitutes: [...homeSubstitutes, ...awaySubstitutes]),
              const Gap(50),
            ],
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
