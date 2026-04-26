part of 'widgets.dart';

class CardSettingItem extends StatelessWidget {
  const CardSettingItem(
      {super.key,
      required this.icon,
      required this.color,
      required this.label,
      this.fullColor,
      this.onTap});
  final String icon;
  final Color color;
  final String label;
  final Function()? onTap;
  final Color? fullColor;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color,
              child: SvgPicture.asset(icon),
            ),
            const Gap(10),
            Expanded(
              child: Text(
                label,
                style: context.textTheme.bodyMedium!.copyWith(
                  color: fullColor,
                ),
              ),
            ),
            if (fullColor == null)
              const Icon(
                Icons.arrow_forward_ios,
                size: 18,
              ),
          ],
        ),
      ),
    );
  }
}

class SheetLogOut extends StatelessWidget {
  const SheetLogOut({super.key});

  @override
  Widget build(BuildContext context) {
    return Ink(
      width: context.width,
      decoration: const BoxDecoration(
          color: AppColor.background,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          )),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Logout',
            style: context.textTheme.headlineSmall!.copyWith(
              color: AppColor.logout,
            ),
          ),
          const Divider(
            endIndent: 20,
            indent: 20,
            height: 40,
          ),
          const Text('Are you sure you want to log out?'),
          const Gap(20),
          Row(
            children: [
              Expanded(
                child: CardLogin(
                  label: 'Cancel',
                  color: AppColor.info,
                  onTap: () => Navigator.pop(context),
                ),
              ),
              const Gap(10),
              Expanded(
                child: CardLogin(
                  label: 'Yes, Logout',
                  color: AppColor.primary,
                  onTap: () {
                    context.pushReplacement("/");
                  },
                ),
              ),
            ],
          ),
          const Gap(40),
        ],
      ),
    );
  }
}

class CardTileSwitch extends StatelessWidget {
  const CardTileSwitch(
      {super.key,
      required this.label,
      required this.value,
      required this.onChange});
  final String label;
  final bool value;
  final Function(bool) onChange;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Switch(
            value: value,
            onChanged: onChange,
            trackOutlineColor:
                const MaterialStatePropertyAll(AppColor.background),
          ),
        ],
      ),
    );
  }
}
