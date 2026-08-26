part of '../screens.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  Widget _buildProfileHeader(BuildContext context) {
    return BlocBuilder<SettingCubit, SettingState>(
      builder: (context, state) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              colors: [
                Theme.of(context).cardColor,
                Theme.of(context).cardColor.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border:
                      Border.all(color: AppColor.accent, width: 2),
                  image: state.userPhoto != null
                      ? DecorationImage(
                          image: FileImage(File(state.userPhoto!)),
                          fit: BoxFit.cover,
                        )
                      : const DecorationImage(
                          image: NetworkImage(AppText.avatar),
                          fit: BoxFit.cover,
                        ),
                ),
              ),
              const Gap(15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      state.userName ?? 'Usuário Campeonato Gaúcho',
                      style: GoogleFonts.urbanist(
                        textStyle: context.textTheme.headlineSmall!.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => context.pushNamed(screenEditInfo),
                icon: CircleAvatar(
                  backgroundColor:
                      AppColor.accent.withOpacity(0.15),
                  child: SvgPicture.asset(
                    Assets.edit,
                    width: 18,
                    color: AppColor.accent,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: AppDrawer(),
      appBar: AppBar(
        title: Text('account'.tr(context)),
        centerTitle: true,
        flexibleSpace: buildBlurFlexibleSpace(),
      ),
      body: ListView(
        children: [
          const Gap(10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: _buildProfileHeader(context),
          ),
          const Gap(10),
          const Divider(height: 30, endIndent: 10, indent: 10),
          CardSettingItem(
            label: 'profile'.tr(context),
            icon: Assets.accountLine,
            color: AppColor.accent.withOpacity(.12),
            iconColor: AppColor.accent,
            onTap: () {
              context.pushNamed(screenEditInfo);
            },
          ),
          CardSettingItem(
            label: 'theme'.tr(context),
            icon: Assets.eye,
            color: AppColor.accent.withOpacity(.12),
            iconColor: AppColor.accent,
            onTap: () {
              context.pushNamed(screenTheme);
            },
          ),
          CardSettingItem(
            label: 'notifications'.tr(context),
            icon: Assets.bell,
            color: AppColor.accent.withOpacity(.12),
            iconColor: AppColor.accent,
            onTap: () {
              context.pushNamed(screenEditNotification);
            },
          ),
          CardSettingItem(
            label: 'general'.tr(context),
            icon: Assets.general,
            color: AppColor.accent.withOpacity(.12),
            iconColor: AppColor.accent,
            onTap: () {
              context.pushNamed(screenGeneral);
            },
          ),
          CardSettingItem(
            label: 'about'.tr(context),
            icon: Assets.info,
            color: AppColor.accent.withOpacity(.12),
            iconColor: AppColor.accent,
            onTap: () {
              context.pushNamed(screenAbout);
            },
          ),
          CardSettingItem(
            label: 'logout'.tr(context),
            icon: Assets.logout,
            color: AppColor.accent.withOpacity(.12),
            iconColor: AppColor.accent,
            onTap: () {
              showModalBottomSheet(
                  context: context, builder: (builder) => const SheetLogOut());
            },
          ),
        ],
      ),
    );
  }
}
