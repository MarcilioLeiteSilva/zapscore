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
        title: Text(player?.name ?? widget.playerName ?? 'Perfil do Jogador'),
        centerTitle: true,
      ),
      body: isLoading
          ? Center(
              child: LoadingAnimationWidget.staggeredDotsWave(
                color: Theme.of(context).primaryColor,
                size: 40,
              ),
            )
          : player == null
              ? Center(child: Text('player_not_found'.tr(context)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.only(left: 15, right: 15, top: 15, bottom: 120),
                  child: Column(
                    children: [
                      // Header Card
                      _buildHeader(),
                      const Gap(15),
                      // Personal Info Card
                      _buildPersonalInfo(),
                      const Gap(15),
                      // Stats Card
                      if (player!.statistics.isNotEmpty) ...[
                        for (int i = 0; i < (player!.statistics.length > 2 ? 2 : player!.statistics.length); i++)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 15),
                            child: _buildStats(player!.statistics[i]),
                          ),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeader() {
    final stats = player!.statistics.isNotEmpty ? player!.statistics[0] : null;
    final team = stats?['team'];
    final games = stats?['games'];
    final position = games?['position'] ?? 'Jogador';
    final number = games?['number'] != null ? '#${games['number']}' : '';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.appColors.info ?? Colors.transparent, width: 1),
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              CircleAvatar(
                radius: 50,
                backgroundColor: context.appColors.info ?? Colors.black26,
                backgroundImage: player!.photo != null ? NetworkImage(proxyImage(player!.photo!)) : null,
                child: player!.photo == null ? const Icon(Icons.person, size: 50, color: Colors.white54) : null,
              ),
              if (team != null && team['logo'] != null)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: CachedNetworkImage(
                      imageUrl: proxyImage(team['logo']),
                      width: 24,
                      height: 24,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
            ],
          ),
          const Gap(12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                player!.name,
                style: context.textTheme.bodyLarge!.copyWith(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              if (number.isNotEmpty) ...[
                const Gap(8),
                Text(
                  number,
                  style: TextStyle(
                    color: Theme.of(context).primaryColor,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ],
          ),
          if (player!.firstname != null && player!.lastname != null)
            Text(
              "${player!.firstname} ${player!.lastname}",
              style: context.textTheme.bodySmall?.copyWith(color: Colors.white70),
            ),
          const Gap(8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              position,
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          if (player!.injured) ...[
            const Gap(8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.redAccent, width: 0.8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.medical_services_outlined, size: 14, color: Colors.redAccent),
                  const Gap(4),
                  Text(
                    'injured'.tr(context),
                    style: const TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
          const Gap(12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (player!.nationality != null) ...[
                const Icon(Icons.flag_outlined, size: 16, color: Colors.white70),
                const Gap(4),
                Text(player!.nationality!, style: context.textTheme.labelSmall),
                const Gap(15),
              ],
              if (player!.age != null) ...[
                const Icon(Icons.cake_outlined, size: 16, color: Colors.white70),
                const Gap(4),
                Text("${player!.age} ${'years'.tr(context)}", style: context.textTheme.labelSmall),
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
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.appColors.info ?? Colors.transparent, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("personal_info".tr(context), style: context.textTheme.bodyMedium!.copyWith(fontWeight: FontWeight.bold)),
          Divider(height: 25, color: context.appColors.info),
          if (player!.birthDate != null) _buildInfoRow("date_of_birth".tr(context), player!.birthDate!),
          if (player!.birthPlace != null || player!.birthCountry != null)
            _buildInfoRow("place_of_birth".tr(context), "${player!.birthPlace ?? ''}${player!.birthPlace != null && player!.birthCountry != null ? ', ' : ''}${player!.birthCountry ?? ''}"),
          if (player!.height != null) _buildInfoRow("height".tr(context), player!.height!),
          if (player!.weight != null) _buildInfoRow("weight".tr(context), player!.weight!),
          _buildInfoRow("status".tr(context), player!.injured ? "in_treatment".tr(context) : "available".tr(context)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: context.textTheme.labelSmall!.copyWith(color: Colors.white70)),
          Text(value, style: context.textTheme.bodySmall!.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildStats(dynamic stats) {
    final team = stats['team'];
    final league = stats['league'];
    final games = stats['games'] ?? {};
    final goals = stats['goals'] ?? {};
    final passes = stats['passes'] ?? {};
    final cards = stats['cards'] ?? {};

    final ratingStr = games['rating'] != null ? games['rating'].toString() : null;
    final formattedRating = ratingStr != null && ratingStr.length >= 3 ? ratingStr.substring(0, 3) : (ratingStr ?? '-');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.appColors.info ?? Colors.transparent, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      league?['name'] ?? "Estatísticas da Temporada",
                      style: context.textTheme.bodyMedium!.copyWith(fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (team?['name'] != null)
                      Text(
                        team['name'],
                        style: context.textTheme.labelSmall?.copyWith(color: Colors.white60),
                      ),
                  ],
                ),
              ),
              if (team != null && team['logo'] != null)
                CachedNetworkImage(imageUrl: proxyImage(team['logo']), width: 28, height: 28, fit: BoxFit.contain),
            ],
          ),
          Divider(height: 25, color: context.appColors.info),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem("Jogos", games['appearences']?.toString() ?? '0'),
              _buildStatItem("Titular", games['lineups']?.toString() ?? '0'),
              _buildStatItem("Minutos", games['minutes']?.toString() ?? '0'),
              _buildStatItem("Nota", formattedRating, color: Colors.amber),
            ],
          ),
          const Gap(15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem("Gols", goals['total']?.toString() ?? '0', color: Colors.greenAccent),
              _buildStatItem("Assistências", goals['assists']?.toString() ?? '0', color: Colors.lightBlueAccent),
              _buildStatItem("Passes %", passes['accuracy'] != null ? "${passes['accuracy']}%" : '-'),
              _buildStatItem("Cartões", "${cards['yellow'] ?? 0}🟨 / ${cards['red'] ?? 0}🟥"),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, {Color? color}) {
    return Column(
      children: [
        Text(
          value,
          style: context.textTheme.bodyMedium!.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const Gap(2),
        Text(label, style: context.textTheme.labelSmall!.copyWith(fontSize: 10, color: Colors.white70)),
      ],
    );
  }
}
