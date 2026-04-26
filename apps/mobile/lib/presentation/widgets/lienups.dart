part of 'widgets.dart';

class CardSubstitutionPlayers extends StatelessWidget {
  const CardSubstitutionPlayers({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SUBSTITUTIONS PLAYERS',
            style: context.textTheme.bodySmall,
          ),
          const Divider(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 6,
            ),
            itemCount: 8,
            itemBuilder: (_, i) {
              return const PlayerSubstitutionPlayerItem();
            },
          ),
        ],
      ),
    );
  }
}

class CardSubstitution extends StatelessWidget {
  const CardSubstitution({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: AppColor.card,
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SUBSTITUTIONS',
            style: context.textTheme.bodySmall,
          ),
          const Divider(height: 20),
          GridView.builder(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            physics: const ScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 4,
            ),
            itemCount: 10,
            itemBuilder: (_, i) {
              return const PlayerSubstitutionItem();
            },
          ),
        ],
      ),
    );
  }
}

class PlayerSubstitutionItem extends StatelessWidget {
  const PlayerSubstitutionItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          "29'",
          style: context.textTheme.bodySmall!.copyWith(
            fontSize: 15,
          ),
        ),
        const Gap(10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                children: [
                  SvgPicture.asset(
                    Assets.subOut,
                  ),
                  const Gap(5),
                  Flexible(
                    child: Text(
                      "P. Aumbareyk'",
                      maxLines: 1,
                      style: context.textTheme.bodySmall!.copyWith(
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const Gap(5),
              Row(
                children: [
                  SvgPicture.asset(
                    Assets.subIn,
                  ),
                  const Gap(5),
                  Flexible(
                    child: Text(
                      "Oleksandr Zinc'",
                      maxLines: 1,
                      style: context.textTheme.bodySmall!.copyWith(
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class PlayerSubstitutionPlayerItem extends StatelessWidget {
  const PlayerSubstitutionPlayerItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColor.info,
              )),
          padding: const EdgeInsets.all(8),
          child: Text(
            "29",
            style: context.textTheme.bodySmall!.copyWith(
              fontSize: 11,
            ),
          ),
        ),
        const Gap(10),
        Expanded(
          child: Flexible(
            child: Text(
              "P. Aumbareyk'",
              maxLines: 1,
              style: context.textTheme.bodySmall!.copyWith(
                fontSize: 12,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class CardLineup extends StatelessWidget {
  const CardLineup({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: context.width,
      height: context.height * .7,
      child: Stack(
        children: [
          SvgPicture.asset(Assets.terrain),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 15),
            child: Column(
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 5),
                  child: Text(
                    'Chelsea 4-3-3',
                    style: TextStyle(fontSize: 15),
                  ),
                ),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      PlayerLineupItem(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          PlayerLineupItem(hasGoal: true),
                          PlayerLineupItem(),
                          PlayerLineupItem(),
                          PlayerLineupItem(),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          PlayerLineupItem(),
                          PlayerLineupItem(),
                          PlayerLineupItem(hasYellow: true),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          PlayerLineupItem(),
                          PlayerLineupItem(hasYellow: true),
                          PlayerLineupItem(),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      PlayerLineupItem(isWhite: true),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          PlayerLineupItem(isWhite: true, hasGoal: true),
                          PlayerLineupItem(isWhite: true),
                          PlayerLineupItem(isWhite: true),
                          PlayerLineupItem(isWhite: true, hasRed: true),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          PlayerLineupItem(isWhite: true),
                          PlayerLineupItem(isWhite: true),
                          PlayerLineupItem(isWhite: true, hasGoal: true),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          PlayerLineupItem(isWhite: true),
                          PlayerLineupItem(isWhite: true),
                          PlayerLineupItem(isWhite: true),
                        ],
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 5),
                  child: Text(
                    'Arsenal 4-2-3-1',
                    style: TextStyle(fontSize: 15),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PlayerLineupItem extends StatelessWidget {
  const PlayerLineupItem(
      {super.key,
      this.isWhite = false,
      this.hasYellow = false,
      this.hasRed = false,
      this.hasGoal = false});
  final bool isWhite;
  final bool hasYellow, hasRed;
  final bool hasGoal;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          children: [
            CircleAvatar(
              backgroundColor: !isWhite ? AppColor.background : Colors.white,
              radius: 15,
              child: Text(
                '16',
                style: TextStyle(
                    fontSize: 13,
                    color: isWhite ? AppColor.background : Colors.white),
              ),
            ),
            if (hasYellow || hasRed)
              Positioned(
                right: 0,
                child: SvgPicture.asset(
                  Assets.yellowCard,
                  width: 8,
                  color: hasRed ? Colors.redAccent : null,
                ),
              ),
            if (hasGoal)
              Positioned(
                left: 0,
                child: SvgPicture.asset(
                  Assets.soccer,
                  width: 13,
                  color: isWhite ? AppColor.background : null,
                ),
              ),
          ],
        ),
        const Text(
          'Mouad zizi',
          style: TextStyle(fontSize: 13),
        ),
      ],
    );
  }
}
