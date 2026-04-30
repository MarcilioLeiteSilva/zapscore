part of '../screens.dart';

class EditNotifScreen extends StatelessWidget {
  const EditNotifScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('notifications'.tr(context)),
        centerTitle: true,
      ),
      body: BlocBuilder<SettingCubit, SettingState>(
        builder: (context, state) {
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            children: [
              const Gap(10),
              _buildSectionHeader(context, 'Geral'),
              _buildSectionContainer(context, [
                _buildSwitchTile(
                  context,
                  label: 'match_alert'.tr(context),
                  value: state.notifMatchAlert,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(match: v),
                ),
                _buildSwitchTile(
                  context,
                  label: 'featured_news'.tr(context),
                  value: state.notifNews,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(news: v),
                ),
                _buildSwitchTile(
                  context,
                  label: 'featured_video'.tr(context),
                  value: state.notifVideo,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(video: v),
                ),
              ]),

              const Gap(24),
              _buildSectionHeader(context, 'Conteúdo & Promocional'),
              _buildSectionContainer(context, [
                _buildSwitchTile(
                  context,
                  label: 'streaming'.tr(context),
                  value: state.notifStreaming,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(streaming: v),
                ),
                _buildSwitchTile(
                  context,
                  label: 'promotions'.tr(context),
                  value: state.notifPromotions,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(promotions: v),
                ),
                _buildSwitchTile(
                  context,
                  label: 'app_updates'.tr(context),
                  value: state.notifAppUpdates,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(updates: v),
                ),
              ]),

              const Gap(24),
              _buildSectionHeader(context, 'times'.tr(context)),
              BlocBuilder<FavoriteCubit, FavoriteState>(
                builder: (context, favState) {
                  if (favState is FavoriteLoaded && favState.favoriteTeams.isNotEmpty) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(15),
                            child: Row(
                              children: [
                                Text(
                                  'Meus Clubes',
                                  style: context.textTheme.labelLarge!.copyWith(fontWeight: FontWeight.bold),
                                ),
                                const Spacer(),
                                Text(
                                  'matches'.tr(context),
                                  style: context.textTheme.bodySmall,
                                ),
                                const Gap(15),
                                Text(
                                  'news'.tr(context),
                                  style: context.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          const Divider(height: 0),
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            itemBuilder: (_, i) {
                              final team = favState.favoriteTeams[i];
                              final prefs = state.teamNotifs[team.id] ?? {'matches': true, 'news': true};
                              return CardTeamNotifSettings(
                                team: team,
                                matchesNotif: prefs['matches'] ?? true,
                                newsNotif: prefs['news'] ?? true,
                                onMatchesChanged: (v) => context.read<SettingCubit>().updateTeamNotif(team.id, v, prefs['news'] ?? true),
                                onNewsChanged: (v) => context.read<SettingCubit>().updateTeamNotif(team.id, prefs['matches'] ?? true, v),
                              );
                            },
                            separatorBuilder: (_, i) => const Divider(
                              endIndent: 20,
                              indent: 20,
                            ),
                            itemCount: favState.favoriteTeams.length,
                          ),
                        ],
                      ),
                    );
                  }
                  return Container(
                    width: context.width,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.star_border, size: 40, color: Colors.grey),
                        const Gap(10),
                        Text(
                          'Você ainda não segue nenhum time.',
                          style: context.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  );
                },
              ),
              const Gap(40),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: context.textTheme.labelLarge!.copyWith(
          color: Theme.of(context).primaryColor,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSectionContainer(BuildContext context, List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).dividerColor.withOpacity(0.05),
        ),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSwitchTile(BuildContext context, {required String label, required bool value, required Function(bool) onChanged}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: CardTileSwitch(
        label: label,
        value: value,
        onChange: onChanged,
      ),
    );
  }
}
