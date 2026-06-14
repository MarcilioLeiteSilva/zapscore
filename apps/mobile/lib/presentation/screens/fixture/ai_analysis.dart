part of '../screens.dart';

class AiAnalysisFixPage extends StatefulWidget {
  const AiAnalysisFixPage({super.key, required this.fixture});
  final Fixture fixture;

  @override
  State<AiAnalysisFixPage> createState() => _AiAnalysisFixPageState();
}

class _AiAnalysisFixPageState extends State<AiAnalysisFixPage> {
  Map<String, dynamic>? _analysis;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAnalysis();
  }

  Future<void> _loadAnalysis() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final apiClient = context.read<FixtureCubit>().apiClient;
      final data = await apiClient.getFixtureAiAnalysis(widget.fixture.id);
      if (mounted) {
        setState(() {
          _analysis = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null || _analysis == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.analytics_outlined,
              size: 60,
              color: Colors.white24,
            ),
            const Gap(15),
            Text(
              'no_stats'.tr(context),
              style: context.textTheme.bodySmall!.copyWith(
                color: Colors.white54,
                fontSize: 16,
              ),
            ),
            const Gap(15),
            ElevatedButton(
              onPressed: _loadAnalysis,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.appColors.info,
                foregroundColor: Colors.white,
              ),
              child: const Text('Recarregar'),
            ),
          ],
        ),
      );
    }

    final int probHome = _analysis!['probHome'] ?? 33;
    final int probDraw = _analysis!['probDraw'] ?? 34;
    final int probAway = _analysis!['probAway'] ?? 33;
    final String summary = _analysis!['predictionSummary'] ?? '';
    final List<dynamic> tips = _analysis!['tips'] ?? [];
    final String commentary = _analysis!['commentary'] ?? '';
    final bool lineupsFactored = _analysis!['lineupsFactored'] ?? false;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      children: [
        const Gap(20),
        // Card de Probabilidades
        Container(
          width: context.width,
          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: Theme.of(context).cardColor,
            border: Border.all(
              color: context.appColors.info ?? Colors.transparent,
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: double.infinity,
                child: Wrap(
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Text(
                      'Probabilidades de Vitória',
                      style: context.textTheme.bodySmall!.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (lineupsFactored)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.green, width: 1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.check_circle_outline,
                              color: Colors.green,
                              size: 12,
                            ),
                            const Gap(4),
                            Text(
                              'Escalações confirmadas',
                              style: context.textTheme.labelSmall!.copyWith(
                                color: Colors.green,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const Gap(15),
              // Barra segmentada horizontal tripla
              ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: SizedBox(
                  height: 20,
                  width: double.infinity,
                  child: Row(
                    children: [
                      if (probHome > 0)
                        Expanded(
                          flex: probHome,
                          child: Container(
                            color: Colors.white,
                            alignment: Alignment.center,
                            child: Text(
                              '$probHome%',
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      if (probDraw > 0)
                        Expanded(
                          flex: probDraw,
                          child: Container(
                            color: context.appColors.info ?? Colors.grey[700],
                            alignment: Alignment.center,
                            child: Text(
                              '$probDraw%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      if (probAway > 0)
                        Expanded(
                          flex: probAway,
                          child: Container(
                            color: Theme.of(context).primaryColor,
                            alignment: Alignment.center,
                            child: Text(
                              '$probAway%',
                              style: TextStyle(
                                color:
                                    Theme.of(context).primaryColor ==
                                        Colors.white
                                    ? Colors.black
                                    : Colors.black,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const Gap(15),
              // Legendas com nomes reais dos times
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const Gap(6),
                        Flexible(
                          child: Text(
                            widget.fixture.homeTeam?.name ?? 'Mandante',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.textTheme.labelSmall!.copyWith(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: context.appColors.info ?? Colors.grey[700],
                          shape: BoxShape.circle,
                        ),
                      ),
                      const Gap(6),
                      Text(
                        'Empate',
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: Theme.of(context).primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const Gap(6),
                        Flexible(
                          child: Text(
                            widget.fixture.awayTeam?.name ?? 'Visitante',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.textTheme.labelSmall!.copyWith(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Gap(20),

        // Card de Resumo / Frase curta
        if (summary.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: context.appColors.info ?? Colors.transparent,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.tips_and_updates_outlined,
                  color: Theme.of(context).primaryColor,
                  size: 28,
                ),
                const Gap(15),
                Expanded(
                  child: Text(
                    summary,
                    style: context.textTheme.bodySmall!.copyWith(
                      color: Colors.white,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.normal,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Gap(20),
        ],

        // Palpites rápidos (Chips)
        if (tips.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Text(
              'Palpites Rápidos',
              style: context.textTheme.bodySmall!.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const Gap(10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: tips.map((tip) {
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color:
                        context.appColors.info?.withOpacity(0.5) ??
                        Colors.white10,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Theme.of(context).primaryColor.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    tip.toString(),
                    style: context.textTheme.labelSmall!.copyWith(
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const Gap(25),
        ],

        // Comentário técnico completo
        if (commentary.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Text(
              'Comentário Técnico',
              style: context.textTheme.bodySmall!.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const Gap(10),
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: context.appColors.info ?? Colors.transparent,
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  commentary,
                  style: context.textTheme.labelSmall!.copyWith(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 15,
                    height: 1.5,
                  ),
                ),
                const Divider(height: 30, color: Colors.white10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Análise gerada por IA',
                      style: context.textTheme.labelSmall!.copyWith(
                        color: Colors.white38,
                        fontSize: 12,
                      ),
                    ),
                    const Icon(
                      Icons.auto_awesome,
                      color: Colors.white38,
                      size: 14,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
        const Gap(50),
      ],
    );
  }
}
