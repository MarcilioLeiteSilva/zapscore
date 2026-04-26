part of '../screens.dart';

class ReportFixPage extends StatelessWidget {
  const ReportFixPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      children: [
        const Gap(20),
        Text(
          'Chelsea 0-1 Arsenal: Gabriel Goal the difference at stamford Bridge',
          style: context.textTheme.headlineSmall,
        ),
        const Gap(10),
        SizedBox(
          width: context.width,
          height: context.height * .3,
          child: const CardNoImage(radius: 20),
        ),
        const Gap(10),
        Text(
          AppText.report,
          style: context.textTheme.labelSmall!.copyWith(
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}
