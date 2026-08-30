part of 'widgets.dart';

class CardSettingItem extends StatelessWidget {
  const CardSettingItem(
      {super.key,
      required this.icon,
      required this.color,
      required this.label,
      this.iconColor,
      this.fullColor,
      this.onTap});
  final String icon;
  final Color color;
  final String label;
  final Color? iconColor;
  final Function()? onTap;
  final Color? fullColor;

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? Colors.red;
    final effectiveTextColor = Theme.of(context).colorScheme.onSurface;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: color,
              child: SvgPicture.asset(
                icon, 
                color: effectiveIconColor,
                width: 24,
              ),
            ),
            const Gap(10),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.urbanist(
                  textStyle: context.textTheme.bodyMedium!.copyWith(
                    color: fullColor ?? effectiveTextColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 18,
              color: effectiveIconColor,
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
      decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          )),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'logout'.tr(context),
            style: context.textTheme.headlineSmall!.copyWith(
              color: context.appColors.logout,
            ),
          ),
          const Divider(
            endIndent: 20,
            indent: 20,
            height: 40,
          ),
          Text('logout_confirm'.tr(context)),
          const Gap(20),
          Row(
            children: [
              Expanded(
                child: CardLogin(
                  label: 'cancel'.tr(context),
                  color: context.appColors.info,
                  onTap: () => Navigator.pop(context),
                ),
              ),
              const Gap(10),
              Expanded(
                child: CardLogin(
                  label: 'yes_logout'.tr(context),
                  color: Theme.of(context).primaryColor,
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
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.urbanist(
              textStyle: context.textTheme.bodyMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChange,
            trackOutlineColor:
                MaterialStatePropertyAll(Theme.of(context).scaffoldBackgroundColor),
          ),
        ],
      ),
    );
  }
}
