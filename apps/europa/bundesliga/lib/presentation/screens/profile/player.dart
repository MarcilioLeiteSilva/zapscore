part of '../screens.dart';

class PlayerProfileScreen extends StatefulWidget {
  const PlayerProfileScreen({super.key, required this.playerId, this.playerName});
  final int playerId;
  final String? playerName;

  @override
  State<PlayerProfileScreen> createState() => _PlayerProfileScreenState();
}

class _PlayerProfileScreenState extends State<PlayerProfileScreen> {
  PlayerProfile? player;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlayer();
  }

  Future<void> _loadPlayer() async {
    try {
      final data = await ApiClient().getPlayerDetails(widget.playerId);
      if (mounted) {
        setState(() {
          player = data;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(player?.name ?? widget.playerName ?? 'Player Profile'),
      ),
      body: isLoading
          ? Center(
              child: LoadingAnimationWidget.staggeredDotsWave(
                color: Theme.of(context).primaryColor,
                size: 40,
              ),
            )
          : player == null
              ? const Center(child: Text('Player details not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 60),
                  child: Column(
                    children: [
                      // Header Card
                      _buildHeader(),
                      const Gap(20),
                      // Personal Info Card
                      _buildPersonalInfo(),
                      const Gap(20),
                      // Stats Card
                      if (player!.statistics.isNotEmpty) _buildStats(),
                      const Gap(20), // Extra space at the bottom
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: context.appColors.info,
            backgroundImage: player!.photo != null ? NetworkImage(proxyImage(player!.photo!)) : null,
            child: player!.photo == null ? const Icon(Icons.person, size: 50, color: Colors.white54) : null,
          ),
          const Gap(15),
          Text(
            player!.name,
            style: context.textTheme.bodyLarge!.copyWith(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          if (player!.firstname != null && player!.lastname != null)
            Text(
              "${player!.firstname} ${player!.lastname}",
              style: context.textTheme.bodySmall,
            ),
          const Gap(10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (player!.nationality != null) ...[
                const Icon(Icons.flag, size: 16, color: Colors.white70),
                const Gap(5),
                Text(player!.nationality!, style: context.textTheme.labelSmall),
                const Gap(15),
              ],
              if (player!.age != null) ...[
                const Icon(Icons.calendar_today, size: 16, color: Colors.white70),
                const Gap(5),
                Text("${player!.age} years", style: context.textTheme.labelSmall),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Personal Information", style: context.textTheme.bodyMedium!.copyWith(fontWeight: FontWeight.bold)),
          Divider(height: 30, color: context.appColors.info),
          _buildInfoRow("Birth Date", player!.birthDate ?? 'N/A'),
          _buildInfoRow("Birth Place", "${player!.birthPlace ?? ''}, ${player!.birthCountry ?? ''}"),
          _buildInfoRow("Height", player!.height ?? 'N/A'),
          _buildInfoRow("Weight", player!.weight ?? 'N/A'),
          _buildInfoRow("Injured", player!.injured ? "Yes" : "No"),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: context.textTheme.labelSmall!.copyWith(color: Colors.white70)),
          Text(value, style: context.textTheme.bodySmall!.copyWith(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildStats() {
    // Take the first statistics entry for now (usually current season/team)
    final stats = player!.statistics[0];
    final team = stats['team'];
    final league = stats['league'];
    final games = stats['games'];
    final goals = stats['goals'];
    final cards = stats['cards'];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColor.info, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Current Season Stats", style: context.textTheme.bodyMedium!.copyWith(fontWeight: FontWeight.bold)),
              if (team != null && team['logo'] != null)
                CachedNetworkImage(imageUrl: proxyImage(team['logo']), width: 24, height: 24),
            ],
          ),
          Divider(height: 30, color: context.appColors.info),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem("Matches", games['appearences']?.toString() ?? '0'),
              _buildStatItem("Goals", goals['total']?.toString() ?? '0'),
              _buildStatItem("Assists", goals['assists']?.toString() ?? '0'),
            ],
          ),
          const Gap(20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem("Rating", (games['rating']?.toString() ?? '0.0').substring(0, 3)),
              _buildStatItem("Yellow", cards['yellow']?.toString() ?? '0', color: Colors.yellow),
              _buildStatItem("Red", cards['red']?.toString() ?? '0', color: Colors.red),
            ],
          ),
          if (league != null) ...[
            const Gap(15),
            Center(
              child: Text(
                "${league['name']} - ${team?['name'] ?? ''}",
                style: context.textTheme.labelSmall!.copyWith(fontStyle: FontStyle.italic),
              ),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, {Color? color}) {
    return Column(
      children: [
        Text(
          value,
          style: context.textTheme.bodyLarge!.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: context.textTheme.labelSmall!.copyWith(fontSize: 10)),
      ],
    );
  }
}
