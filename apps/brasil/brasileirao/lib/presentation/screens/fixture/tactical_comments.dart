part of '../screens.dart';

class TacticalCommentsFixPage extends StatefulWidget {
  final Fixture fixture;
  const TacticalCommentsFixPage({super.key, required this.fixture});

  @override
  State<TacticalCommentsFixPage> createState() => _TacticalCommentsFixPageState();
}

class _TacticalCommentsFixPageState extends State<TacticalCommentsFixPage> {
  List<TacticalComment> _comments = [];
  bool _loading = true;
  String? _error;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _loadComments();
    _setupAutoPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _setupAutoPolling() {
    // Se a partida estiver ao vivo, atualiza os comentários a cada 30 segundos
    final status = widget.fixture.statusShort ?? '';
    final isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].contains(status);
    if (isLive) {
      _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) {
          _loadComments(silent: true);
        }
      });
    }
  }

  Future<void> _loadComments({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final apiClient = context.read<HomeCubit>().apiClient;
      final int fixtureExtId = widget.fixture.externalId > 0
          ? widget.fixture.externalId
          : (int.tryParse(widget.fixture.id) ?? 0);

      final result = await apiClient.getFixtureTacticalComments(fixtureExtId);

      if (mounted) {
        setState(() {
          _comments = result;
          _loading = false;
          _error = null;
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

  String _formatPhase(String phase) {
    switch (phase.toUpperCase()) {
      case 'PRE_MATCH':
        return 'Pré-Jogo';
      case 'FIRST_HALF':
        return '1º Tempo';
      case 'HALF_TIME':
        return 'Intervalo';
      case 'SECOND_HALF':
        return '2º Tempo';
      case 'FULL_TIME':
        return 'Fim de Jogo';
      default:
        return phase;
    }
  }

  Color _getSentimentColor(String? sentiment) {
    final s = sentiment?.toUpperCase() ?? '';
    if (s.contains('DOMINANT') || s.contains('DOMINANTE')) {
      return const Color(0xFF10B981); // Emerald
    }
    if (s.contains('CRITICAL') || s.contains('CRITICO') || s.contains('CRÍTICO')) {
      return const Color(0xFFF59E0B); // Amber
    }
    if (s.contains('SURPRISE') || s.contains('SURPRESA')) {
      return const Color(0xFFA855F7); // Purple
    }
    return const Color(0xFF38BDF8); // Sky blue (Balanced/Equilibrado)
  }

  String _formatSentiment(String? sentiment) {
    final s = sentiment?.toUpperCase() ?? '';
    if (s.contains('DOMINANT') || s.contains('DOMINANTE')) return '🔥 Dominante';
    if (s.contains('CRITICAL') || s.contains('CRITICO') || s.contains('CRÍTICO')) return '⚠️ Crítico';
    if (s.contains('SURPRISE') || s.contains('SURPRESA')) return '⚡ Surpresa';
    return '⚖️ Equilibrado';
  }

  Widget _buildPhaseBadge(TacticalComment item) {
    IconData icon;
    String label;

    switch (item.phase.toUpperCase()) {
      case 'PRE_MATCH':
        icon = Icons.assignment_outlined;
        label = 'Pré-Jogo';
        break;
      case 'FIRST_HALF':
        icon = Icons.timer_outlined;
        label = item.minute != null && item.minute! > 0 ? "${item.minute}' 1ºT" : '1º Tempo';
        break;
      case 'HALF_TIME':
        icon = Icons.pause_circle_outline;
        label = 'Intervalo';
        break;
      case 'SECOND_HALF':
        icon = Icons.timer_outlined;
        label = item.minute != null && item.minute! > 0 ? "${item.minute}' 2ºT" : '2º Tempo';
        break;
      case 'FULL_TIME':
        icon = Icons.sports_score;
        label = 'Fim de Jogo';
        break;
      default:
        icon = Icons.sports_soccer;
        label = item.phase;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColor.background,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColor.accent.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white70),
          const Gap(5),
          Text(
            label,
            style: GoogleFonts.urbanist(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 11.5,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _comments.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _comments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.white38, size: 48),
              const Gap(12),
              Text(
                'error_ai_stats'.tr(context),
                style: GoogleFonts.urbanist(color: Colors.white70, fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const Gap(12),
              ElevatedButton.icon(
                onPressed: () => _loadComments(),
                icon: const Icon(Icons.refresh, size: 18),
                label: Text('retry'.tr(context)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColor.accent,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_comments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.chat_bubble_outline, color: Colors.white24, size: 54),
              const Gap(14),
              Text(
                'Nenhum comentário disponível no momento.',
                style: GoogleFonts.urbanist(
                  color: Colors.white70,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const Gap(8),
              Text(
                'Os comentários da partida são gerados durante o andamento do jogo.',
                style: GoogleFonts.urbanist(
                  color: Colors.white38,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
              const Gap(16),
              OutlinedButton.icon(
                onPressed: () => _loadComments(),
                icon: const Icon(Icons.refresh, size: 16, color: Colors.white70),
                label: Text(
                  'reload'.tr(context),
                  style: GoogleFonts.urbanist(color: Colors.white70),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white24),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadComments(silent: true),
      color: AppColor.accent,
      child: ListView.builder(
        padding: const EdgeInsets.only(left: 10, right: 12, top: 12, bottom: 120),
        itemCount: _comments.length,
        itemBuilder: (context, index) {
          final item = _comments[index];
          final sentimentColor = _getSentimentColor(item.sentiment);

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Linha do Tempo Vertical Conectada
                SizedBox(
                  width: 22,
                  child: Column(
                    children: [
                      // Linha superior
                      Container(
                        width: 2,
                        height: 14,
                        color: index == 0
                            ? Colors.transparent
                            : Colors.white.withValues(alpha: 0.2),
                      ),
                      // Nó da timeline com a cor do sentimento
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: sentimentColor,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.7),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: sentimentColor.withValues(alpha: 0.5),
                              blurRadius: 4,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                      ),
                      // Linha inferior
                      Expanded(
                        child: Container(
                          width: 2,
                          color: index == _comments.length - 1
                              ? Colors.transparent
                              : Colors.white.withValues(alpha: 0.2),
                        ),
                      ),
                    ],
                  ),
                ),
                const Gap(8),
                // 3. Card do Comentário com Faixa Lateral Colorida (Accent Strip)
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: AppColor.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08),
                        width: 1,
                      ),
                    ),
                    child: IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Faixa lateral colorida de sentimento
                          Container(
                            width: 3.5,
                            color: sentimentColor,
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(13),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // 2. Cabeçalho com Ícone da Fase + Badge com Emoji do Sentimento
                                  Row(
                                    children: [
                                      _buildPhaseBadge(item),
                                      const Spacer(),
                                      if (item.sentiment != null && item.sentiment!.isNotEmpty)
                                        Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: sentimentColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: sentimentColor.withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  _formatSentiment(item.sentiment),
                                  style: GoogleFonts.urbanist(
                                    color: sentimentColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const Gap(10),
                        // Título
                        if (item.title.isNotEmpty) ...[
                          Text(
                            item.title,
                            style: GoogleFonts.urbanist(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              height: 1.3,
                            ),
                          ),
                          const Gap(8),
                        ],
                        // Comentário
                        Text(
                          item.comment,
                          style: GoogleFonts.urbanist(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 13.5,
                            height: 1.45,
                          ),
                        ),
                        if (item.created != null) ...[
                          const Gap(10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Icon(
                                Icons.access_time,
                                size: 12,
                                color: Colors.white.withValues(alpha: 0.35),
                              ),
                              const Gap(4),
                              Text(
                                DateFormat('HH:mm').format(item.created!.toLocal()),
                                style: GoogleFonts.urbanist(
                                  color: Colors.white.withValues(alpha: 0.35),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ],
  ),
);
},
),
);
}
}
