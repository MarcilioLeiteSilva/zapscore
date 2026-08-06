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
      final lang = context.read<SettingCubit>().state.language;
      final data = await apiClient.getFixtureAiAnalysis(widget.fixture.id, lang);
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

  String _translateTip(String tip, BuildContext context) {
    final Map<String, Map<String, String>> tipDict = {
      'Ambas Marcam': {'pt': 'Ambas Marcam', 'en': 'Both Teams to Score', 'es': 'Ambos Anotan', 'de': 'Beide Teams treffen'},
      'Ambas marcam': {'pt': 'Ambas Marcam', 'en': 'Both Teams to Score', 'es': 'Ambos Anotan', 'de': 'Beide Teams treffen'},
      'Vitória Mandante': {'pt': 'Vitória Mandante', 'en': 'Home Win', 'es': 'Victoria Local', 'de': 'Heimsieg'},
      'Vitória Casa': {'pt': 'Vitória Casa', 'en': 'Home Win', 'es': 'Victoria Local', 'de': 'Heimsieg'},
      'Vitória Visitante': {'pt': 'Vitória Visitante', 'en': 'Away Win', 'es': 'Victoria Visitante', 'de': 'Auswärtssieg'},
      'Empate': {'pt': 'Empate', 'en': 'Draw', 'es': 'Empate', 'de': 'Unentschieden'},
    };
    final currentLang = context.read<SettingCubit>().state.language;
    if (tipDict.containsKey(tip) && tipDict[tip]!.containsKey(currentLang)) {
      return tipDict[tip]![currentLang]!;
    }
    var translated = tip;
    if (currentLang == 'en') {
      translated = translated.replaceAll('Mais de', 'Over').replaceAll('Menos de', 'Under').replaceAll('Gols', 'Goals');
    } else if (currentLang == 'es') {
      translated = translated.replaceAll('Mais de', 'Más de').replaceAll('Menos de', 'Menos de').replaceAll('Gols', 'Goles').replaceAll('Over', 'Más de').replaceAll('Under', 'Menos de');
    } else if (currentLang == 'de') {
      translated = translated.replaceAll('Mais de', 'Über').replaceAll('Menos de', 'Unter').replaceAll('Gols', 'Tore').replaceAll('Over', 'Über').replaceAll('Under', 'Unter');
    }
    return translated;
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
              child: Text('reload'.tr(context)),
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
    final bool? isHit = _analysis!['isHit'] as bool?;
    final List<dynamic> tipsStatus = _analysis!['tipsStatus'] is List
        ? _analysis!['tipsStatus'] as List
        : [];

    return ListView(
      padding: const EdgeInsets.only(left: 10, right: 10, top: 0, bottom: 20),
      children: [
        if (widget.fixture.isFinished && isHit != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isHit
                  ? Colors.green.withOpacity(0.1)
                  : Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isHit ? Colors.green : Colors.red,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isHit ? Icons.check_circle_outline : Icons.cancel_outlined,
                  color: isHit ? Colors.green : Colors.red,
                  size: 24,
                ),
                const Gap(12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isHit ? 'correct_prediction'.tr(context) : 'incorrect_prediction'.tr(context),
                        style: context.textTheme.bodySmall!.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isHit ? Colors.green : Colors.red,
                          fontSize: 15,
                        ),
                      ),
                      const Gap(2),
                      Text(
                        isHit
                            ? 'correct_prediction_desc'.tr(context)
                            : 'incorrect_prediction_desc'.tr(context),
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        const Gap(12),
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
                      'win_probabilities'.tr(context),
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
                              'lineups_factored'.tr(context),
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
                            widget.fixture.homeTeam?.name ?? 'home_team'.tr(context),
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
                        'draws'.tr(context),
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
                            widget.fixture.awayTeam?.name ?? 'away_team'.tr(context),
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
        const Gap(12),

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
          const Gap(12),
        ],

        // Palpites rápidos (Chips)
        if (tips.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Text(
              'quick_tips'.tr(context),
              style: context.textTheme.bodySmall!.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const Gap(12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: tips.map((tip) {
                final tipStr = tip.toString();
                bool? isTipHit;
                if (widget.fixture.isFinished) {
                  for (final item in tipsStatus) {
                    if (item is Map && item['tip'] == tipStr) {
                      isTipHit = item['hit'] as bool?;
                      break;
                    }
                  }
                }

                Color chipBgColor = context.appColors.info?.withOpacity(0.5) ?? Colors.white10;
                Color chipTextColor = Theme.of(context).primaryColor;
                Color chipBorderColor = Theme.of(context).primaryColor.withOpacity(0.3);
                IconData? chipIcon;

                if (isTipHit != null) {
                  if (isTipHit) {
                    chipBgColor = Colors.green.withOpacity(0.15);
                    chipTextColor = Colors.green;
                    chipBorderColor = Colors.green;
                    chipIcon = Icons.check_circle_outline;
                  } else {
                    chipBgColor = Colors.red.withOpacity(0.15);
                    chipTextColor = Colors.red;
                    chipBorderColor = Colors.red;
                    chipIcon = Icons.cancel_outlined;
                  }
                }

                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: chipBgColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: chipBorderColor,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (chipIcon != null) ...[
                        Icon(chipIcon, color: chipTextColor, size: 16),
                        const Gap(6),
                      ],
                      Text(
                        _translateTip(tipStr, context),
                        style: context.textTheme.labelSmall!.copyWith(
                          color: chipTextColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const Gap(12),
        ],

        // Comentário técnico completo
        if (commentary.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Text(
              'technical_commentary'.tr(context),
              style: context.textTheme.bodySmall!.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const Gap(12),
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
                      'ai_generated_analysis'.tr(context),
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
        const Gap(20),
      ],
    );
  }
}
