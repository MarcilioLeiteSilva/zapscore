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
                _buildSwitchTile(
                  context,
                  label: 'app_updates'.tr(context),
                  value: state.notifAppUpdates,
                  onChanged: (v) => context.read<SettingCubit>().updateNotifSettings(updates: v),
                ),
              ]),

              const Gap(12),
              _buildSectionHeader(context, 'times'.tr(context)),
              BlocBuilder<FavoriteCubit, FavoriteState>(
                builder: (context, favState) {
                  if (favState is FavoriteLoaded && favState.favoriteTeams.isNotEmpty) {
                    return Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF454444),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            child: Row(
                              children: [
                                Text(
                                  'my_clubs'.tr(context),
                                  style: GoogleFonts.urbanist(
                                    textStyle: context.textTheme.labelLarge!.copyWith(fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  'matches'.tr(context),
                                  style: GoogleFonts.urbanist(
                                    textStyle: context.textTheme.bodySmall!.copyWith(color: Colors.white70),
                                  ),
                                ),
                                const Gap(15),
                                Text(
                                  'news'.tr(context),
                                  style: GoogleFonts.urbanist(
                                    textStyle: context.textTheme.bodySmall!.copyWith(color: Colors.white70),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Divider(height: 0),
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: const EdgeInsets.symmetric(vertical: 2),
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
                      color: const Color(0xFF454444),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.star_border, size: 40, color: Colors.white54),
                        const Gap(10),
                        Text(
                          'no_teams_followed'.tr(context),
                          style: GoogleFonts.urbanist(
                            textStyle: context.textTheme.bodySmall!.copyWith(color: Colors.white70),
                          ),
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
      padding: const EdgeInsets.only(left: 4, bottom: 6),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.urbanist(
          textStyle: context.textTheme.labelLarge!.copyWith(
            color: Theme.of(context).primaryColor,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildSectionContainer(BuildContext context, List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF454444),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSwitchTile(BuildContext context, {required String label, required bool value, required Function(bool) onChanged}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      child: CardTileSwitch(
        label: label,
        value: value,
        onChange: onChanged,
      ),
    );
  }
}
