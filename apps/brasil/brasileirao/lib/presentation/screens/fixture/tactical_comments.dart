part of '../screens.dart';

class TacticalCommentsFixPage extends StatefulWidget {
  final Fixture fixture;
  const TacticalCommentsFixPage({super.key, required this.fixture});

  @override
  State<TacticalCommentsFixPage> createState() => _TacticalCommentsFixPageState();
}

class _TacticalCommentsFixPageState extends State<TacticalCommentsFixPage> {
  List<TacticalComment> _comments = [];
  final Set<String> _expandedCommentIds = {};
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
          final itemId = item.id.isNotEmpty ? item.id : 'comment_$index';
          final isExpanded = _expandedCommentIds.contains(itemId);

          return Stack(
            children: [
              // 1. Linha do Tempo Vertical Conectada
              if (_comments.length > 1)
                Positioned(
                  left: 10,
                  top: index == 0 ? 19 : 0,
                  bottom: index == _comments.length - 1 ? null : 0,
                  height: index == _comments.length - 1 ? 19 : null,
                  child: Container(
                    width: 2,
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
              // 2. Nó da timeline com a cor do sentimento
              Positioned(
                left: 6,
                top: 14,
                child: Container(
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
              ),
              // 3. Card do Comentário com Sanfona (Accordion)
              Padding(
                padding: const EdgeInsets.only(left: 28, bottom: 12),
                child: Container(
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: AppColor.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isExpanded
                          ? sentimentColor.withValues(alpha: 0.35)
                          : Colors.white.withValues(alpha: 0.08),
                      width: 1,
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Faixa lateral colorida contínua
                      Positioned(
                        left: 0,
                        top: 0,
                        bottom: 0,
                        child: Container(
                          width: 3.5,
                          decoration: BoxDecoration(
                            color: sentimentColor,
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(14),
                              bottomLeft: Radius.circular(14),
                            ),
                          ),
                        ),
                      ),
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              if (isExpanded) {
                                _expandedCommentIds.remove(itemId);
                              } else {
                                _expandedCommentIds.add(itemId);
                              }
                            });
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Padding(
                            padding: const EdgeInsets.only(left: 14, right: 12, top: 12, bottom: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // 2. Cabeçalho com Pílula da Fase + Pílula do Sentimento + Seta de Sanfona
                                Row(
                                  children: [
                                    _buildPhaseBadge(item),
                                    const Gap(8),
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
                                    const Spacer(),
                                    // Seta de Sanfona Animada
                                    AnimatedRotation(
                                      turns: isExpanded ? 0.5 : 0.0,
                                      duration: const Duration(milliseconds: 250),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.06),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.keyboard_arrow_down_rounded,
                                          size: 20,
                                          color: isExpanded
                                              ? sentimentColor
                                              : Colors.white.withValues(alpha: 0.7),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                // Título (Sempre Visível)
                                if (item.title.isNotEmpty) ...[
                                  const Gap(10),
                                  Text(
                                    item.title,
                                    style: GoogleFonts.urbanist(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                                // Conteúdo da Sanfona protegido contra overflow com ClipRect + AnimatedSize
                                ClipRect(
                                  child: AnimatedSize(
                                    duration: const Duration(milliseconds: 250),
                                    curve: Curves.easeInOut,
                                    alignment: Alignment.topCenter,
                                    child: isExpanded
                                        ? Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Gap(10),
                                              Divider(
                                                color: Colors.white.withValues(alpha: 0.08),
                                                height: 1,
                                              ),
                                              const Gap(10),
                                              Text(
                                                item.comment,
                                                style: GoogleFonts.urbanist(
                                                  color: Colors.white.withValues(alpha: 0.88),
                                                  fontSize: 13.5,
                                                  height: 1.5,
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
                                          )
                                        : const SizedBox(width: double.infinity, height: 0),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
