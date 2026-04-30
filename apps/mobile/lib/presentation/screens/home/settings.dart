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
                      Border.all(color: Theme.of(context).primaryColor, width: 2),
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
                      state.userName ?? 'ZapScore User',
                      style: context.textTheme.headlineSmall!.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      state.userNickname ?? 'user@zapscore.com',
                      style: context.textTheme.bodySmall!.copyWith(
                        color:
                            context.textTheme.bodySmall!.color?.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => context.pushNamed(screenEditInfo),
                icon: CircleAvatar(
                  backgroundColor:
                      Theme.of(context).primaryColor.withOpacity(0.1),
                  child: SvgPicture.asset(
                    Assets.edit,
                    width: 18,
                    color: Theme.of(context).primaryColor,
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
        centerTitle: false,
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
            color: Colors.orange.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenEditInfo);
            },
          ),
          CardSettingItem(
            label: 'theme'.tr(context),
            icon: Assets.eye,
            color: Colors.blue.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenTheme);
            },
          ),
          CardSettingItem(
            label: 'notifications'.tr(context),
            icon: Assets.bell,
            color: Colors.deepPurple.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenEditNotification);
            },
          ),
          CardSettingItem(
            label: 'general'.tr(context),
            icon: Assets.general,
            color: Colors.pinkAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenGeneral);
            },
          ),
          CardSettingItem(
            label: 'about'.tr(context),
            icon: Assets.info,
            color: Colors.deepPurpleAccent.withOpacity(.1),
            onTap: () {
              context.pushNamed(screenAbout);
            },
          ),
          CardSettingItem(
            label: 'logout'.tr(context),
            icon: Assets.logout,
            color: context.appColors.logout?.withOpacity(.1) ?? Colors.red.withOpacity(.1),
            fullColor: context.appColors.logout,
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
