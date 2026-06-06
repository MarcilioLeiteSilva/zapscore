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
          color: color ?? Theme.of(context).primaryColor,
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
          color: context.appColors.hint,
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
          backgroundColor: context.appColors.info,
        ),
      ),
    );
  }
}

class CardFollowItem extends StatelessWidget {
  const CardFollowItem(
      {super.key, this.onNotif, this.onTap, this.team, this.league});
  final Function(bool?)? onNotif;
  final Function()? onTap;
  final Team? team;
  final League? league;

  @override
  Widget build(BuildContext context) {
    final String? logo = team?.logo ?? league?.logo;
    final String name = team?.name ?? league?.name ?? 'Unknown';
    final String? subtitle = team?.country ?? (league != null ? 'Competition' : null);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
        child: Row(
          children: [
            SizedBox(
              width: 55,
              height: 55,
              child: logo != null
                  ? CachedNetworkImage(imageUrl: proxyImage(logo),
                      errorWidget: (_, __, ___) =>
                          const CardNoImage(radius: 5),
                    )
                  : const CardNoImage(radius: 5),
            ),
            const Gap(10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: context.textTheme.bodyMedium,
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle,
                      style: context.textTheme.labelSmall,
                    ),
                ],
              ),
            ),
            if (team != null || league != null)
              BlocBuilder<FavoriteCubit, FavoriteState>(
                builder: (context, state) {
                  final bool isFav = team != null
                      ? context.read<FavoriteCubit>().isTeamFavorite(team!.id)
                      : context
                          .read<FavoriteCubit>()
                          .isLeagueFavorite(league!.externalId.toString());
                  return LikeButton(
                    size: 25,
                    isLiked: isFav,
                    onTap: (val) async {
                      if (team != null) {
                        context.read<FavoriteCubit>().toggleTeam(team!.id);
                      } else {
                        context
                            .read<FavoriteCubit>()
                            .toggleLeague(league!.externalId.toString());
                      }
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

class CardTeamNotifSettings extends StatelessWidget {
  const CardTeamNotifSettings({
    super.key,
    required this.team,
    required this.matchesNotif,
    required this.newsNotif,
    required this.onMatchesChanged,
    required this.onNewsChanged,
  });

  final Team team;
  final bool matchesNotif;
  final bool newsNotif;
  final Function(bool) onMatchesChanged;
  final Function(bool) onNewsChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        children: [
          SizedBox(
            width: 45,
            height: 45,
            child: team.logo != null
                ? CachedNetworkImage(imageUrl: proxyImage(team.logo!),
                    errorWidget: (_, __, ___) => const CardNoImage(radius: 5),
                  )
                : const CardNoImage(radius: 5),
          ),
          const Gap(12),
          Expanded(
            child: Text(
              team.name,
              style: context.textTheme.bodyMedium!.copyWith(fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const Gap(10),
          // Matches Checkbox
          Checkbox(
            value: matchesNotif,
            onChanged: (v) => onMatchesChanged(v ?? false),
            activeColor: Theme.of(context).primaryColor,
            checkColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
          const Gap(25),
          // News Checkbox
          Checkbox(
            value: newsNotif,
            onChanged: (v) => onNewsChanged(v ?? false),
            activeColor: Theme.of(context).primaryColor,
            checkColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
          const Gap(8),
        ],
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
        color: context.appColors.info?.withOpacity(.6),
      ),
      padding: const EdgeInsets.all(10),
      child: Center(
        child: SvgPicture.asset(Assets.iconSvg),
      ),
    );
  }
}

class CardSearchFollow extends StatelessWidget {
  const CardSearchFollow({super.key, required this.label, this.onChanged});
  final String label;
  final Function(String)? onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: context.width,
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 15),
      child: Row(
        children: [
          SvgPicture.asset(Assets.searchLine),
          const Gap(10),
          Expanded(
            child: TextField(
              onChanged: onChanged,
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
              color: Theme.of(context).primaryColor,
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
            color: Theme.of(context).primaryColor,
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
              color: Theme.of(context).primaryColor,
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
