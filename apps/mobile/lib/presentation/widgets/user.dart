part of 'widgets.dart';

class CardLogin extends StatelessWidget {
  const CardLogin(
      {super.key, this.color, required this.label, required this.onTap});
  final Color? color;
  final String label;
  final Function() onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(50),
      child: Ink(
        width: context.width,
        padding: const EdgeInsets.symmetric(vertical: 15),
        decoration: BoxDecoration(
          color: color ?? AppColor.primary,
          borderRadius: BorderRadius.circular(50),
        ),
        child: Center(
          child: Text(
            label,
            style: context.textTheme.bodySmall,
          ),
        ),
      ),
    );
  }
}

class CardInput extends StatelessWidget {
  const CardInput({super.key, required this.hint, this.controller});
  final String hint;

  final TextEditingController? controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      decoration: InputDecoration(
        hintText: hint,
        label: Text(hint),
        labelStyle: context.textTheme.bodySmall!.copyWith(
          fontSize: 15,
        ),
      ),
      style: context.textTheme.bodyMedium,
    );
  }
}

class CardBirth extends StatelessWidget {
  const CardBirth({super.key, this.controller});

  final TextEditingController? controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      decoration: InputDecoration(
        hintText: 'dd/MM/yyyy',
        hintStyle: context.textTheme.bodySmall!.copyWith(
          color: AppColor.hint,
          fontSize: 15,
        ),
        label: Text(
          'Date of Birth',
          style: context.textTheme.bodySmall!.copyWith(
            fontSize: 15,
          ),
        ),
      ),
      style: context.textTheme.bodyMedium,
      keyboardType: TextInputType.number,
      inputFormatters: [
        DateInputFormatter(),
      ],
    );
  }
}

class LoginBarIndicator extends StatelessWidget {
  const LoginBarIndicator({super.key, required this.value});
  final double value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: context.width * .5,
      height: 10,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(50),
        child: LinearProgressIndicator(
          value: value,
          backgroundColor: AppColor.info,
        ),
      ),
    );
  }
}

class CardFollowItem extends StatelessWidget {
  const CardFollowItem({super.key, this.onNotif, this.onTap, this.team});
  final Function(bool?)? onNotif;
  final Function()? onTap;
  final Team? team;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
        child: Row(
          children: [
            SizedBox(
              width: 55,
              height: 55,
              child: team != null && team!.logo != null
                  ? Image.network(
                      team!.logo!,
                      errorBuilder: (_, __, ___) => const CardNoImage(radius: 5),
                    )
                  : const CardNoImage(radius: 5),
            ),
            const Gap(10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    team?.name ?? 'Unknown Team',
                    style: context.textTheme.bodyMedium,
                  ),
                  Text(
                    team?.country ?? 'Unknown Country',
                    style: context.textTheme.labelSmall,
                  ),
                ],
              ),
            ),
            if (team != null)
              BlocBuilder<FavoriteCubit, FavoriteState>(
                builder: (context, state) {
                  final isFav =
                      context.read<FavoriteCubit>().isTeamFavorite(team!.id);
                  return LikeButton(
                    size: 25,
                    isLiked: isFav,
                    onTap: (val) async {
                      context.read<FavoriteCubit>().toggleTeam(team!.id);
                      return !val;
                    },
                    circleColor: const CircleColor(
                      start: Colors.orange,
                      end: Colors.deepOrange,
                    ),
                    bubblesColor: const BubblesColor(
                      dotPrimaryColor: Colors.orange,
                      dotSecondaryColor: Colors.deepOrange,
                    ),
                    likeBuilder: (bool isLiked) {
                      return Icon(
                        isLiked ? Icons.star : Icons.star_border,
                        color: isLiked ? Colors.amber : Colors.white,
                      );
                    },
                  );
                },
              ),
            if (onNotif != null) ...[
              const Gap(30),
              LikeButton(
                size: 25,
                onTap: (value) async {
                  onNotif!(value);
                  return !value;
                },
                circleColor: const CircleColor(
                  start: Colors.orange,
                  end: Colors.deepOrange,
                ),
                bubblesColor: const BubblesColor(
                  dotPrimaryColor: Colors.orange,
                  dotSecondaryColor: Colors.deepOrange,
                ),
                likeBuilder: (bool isLiked) {
                  return SvgPicture.asset(
                    isLiked ? Assets.bellSolid : Assets.bell,
                  );
                },
              ),
            ]
          ],
        ),
      ),
    );
  }
}

class CardNoImage extends StatelessWidget {
  const CardNoImage({super.key, this.radius = 0});
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      height: context.height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: AppColor.info.withOpacity(.6),
      ),
      padding: const EdgeInsets.all(10),
      child: Center(
        child: SvgPicture.asset(Assets.iconSvg),
      ),
    );
  }
}

class CardSearchFollow extends StatelessWidget {
  const CardSearchFollow({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 15),
      child: Row(
        children: [
          SvgPicture.asset(Assets.searchLine),
          const Gap(10),
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: label,
                border: InputBorder.none,
              ),
              style: context.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class DialogProfileDone extends StatelessWidget {
  const DialogProfileDone({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColor.background,
      surfaceTintColor: AppColor.background,
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Gap(15),
          SvgPicture.asset(
            Assets.profileSuccess,
          ),
          const Gap(20),
          Text(
            'Account Setup\nSuccessful!!',
            textAlign: TextAlign.center,
            style: context.textTheme.bodyLarge!.copyWith(
              color: AppColor.primary,
            ),
          ),
          const Gap(10),
          Text(
            'Please wait a moment, we are\npreparing for you.',
            textAlign: TextAlign.center,
            style: context.textTheme.labelMedium!.copyWith(
              fontSize: 15,
            ),
          ),
          const Gap(15),
          LoadingAnimationWidget.hexagonDots(
            color: AppColor.primary,
            size: 40,
          ),
        ],
      ),
    );
  }
}

class DialogPasswordResetDone extends StatelessWidget {
  const DialogPasswordResetDone({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColor.background,
      surfaceTintColor: AppColor.background,
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Gap(15),
          SvgPicture.asset(
            Assets.passResetDone,
          ),
          const Gap(20),
          Text(
            'Password Reset\nEmail Sent',
            textAlign: TextAlign.center,
            style: context.textTheme.bodyLarge!.copyWith(
              color: AppColor.primary,
            ),
          ),
          const Gap(10),
          Text(
            'Please check your email inbox to\nreset your password.',
            textAlign: TextAlign.center,
            style: context.textTheme.labelMedium!.copyWith(
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}
