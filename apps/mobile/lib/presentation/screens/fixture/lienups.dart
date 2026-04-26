part of '../screens.dart';

class LineupsFixPage extends StatelessWidget {
  const LineupsFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
      children: const [
        Gap(20),
        CardLineup(),
        Gap(15),
        CardSubstitution(),
        Gap(15),
        CardSubstitutionPlayers(),
        Gap(50),
      ],
    );
  }
}
