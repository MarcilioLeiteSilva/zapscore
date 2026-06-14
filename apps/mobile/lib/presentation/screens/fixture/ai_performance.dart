part of '../screens.dart';

class AiPerformanceDashboardPage extends StatefulWidget {
  const AiPerformanceDashboardPage({super.key});

  @override
  State<AiPerformanceDashboardPage> createState() => _AiPerformanceDashboardPageState();
}

class _AiPerformanceDashboardPageState extends State<AiPerformanceDashboardPage> {
  final ApiClient _apiClient = ApiClient();
  
  bool _loading = true;
  String? _error;
  AiPerformanceStats? _stats;
  List<League> _leagues = [];
  
  League? _selectedLeague;
  int? _selectedDays;

  @override
  void initState() {
    super.initState();
    _loadData();
    _loadLeagues();
  }

  Future<void> _loadLeagues() async {
    try {
      final list = await _apiClient.getStoredLeagues();
      setState(() {
        _leagues = list;
      });
    } catch (e) {
      print('Error loading leagues for filter: $e');
    }
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _apiClient.getAiPerformanceStats(
        leagueId: _selectedLeague?.externalId,
        days: _selectedDays,
      );
      if (mounted) {
        setState(() {
          _stats = data;
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
    final theme = Theme.of(context);
    final accentColor = theme.primaryColor;
    final infoColor = context.appColors.info ?? Colors.blue;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Desempenho da IA',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Bloco de Filtros
          _buildFiltersSection(theme, infoColor),
          
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _buildErrorWidget()
                    : _stats == null || _stats!.totalGames == 0
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: _loadData,
                            child: ListView(
                              padding: const EdgeInsets.only(bottom: 40),
                              children: [
                                const Gap(15),
                                // Resumo do Gráfico e Números
                                _buildSummaryCard(theme, accentColor, infoColor),
                                const Gap(20),
                                // Título do Histórico
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    children: [
                                      Icon(Icons.history, color: accentColor, size: 20),
                                      const Gap(8),
                                      Text(
                                        'Jogos Auditados Recentemente',
                                        style: context.textTheme.bodySmall!.copyWith(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Gap(10),
                                // Lista de jogos auditados
                                ..._stats!.recentAudits.map((audit) => RecentAuditItem(audit: audit)),
                              ],
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersSection(ThemeData theme, Color infoColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        border: Border(
          bottom: BorderSide(color: infoColor.withOpacity(0.2), width: 1),
        ),
      ),
      child: Row(
        children: [
          // Filtro de Competições
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white10),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<League?>(
                  value: _selectedLeague,
                  hint: const Text('Todas Competições', style: TextStyle(color: Colors.white54, fontSize: 13)),
                  isExpanded: true,
                  dropdownColor: theme.cardColor,
                  icon: const Icon(Icons.arrow_drop_down, color: Colors.white70),
                  items: [
                    const DropdownMenuItem<League?>(
                      value: null,
                      child: Text('Todas Competições', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ),
                    ..._leagues.map((league) {
                      return DropdownMenuItem<League?>(
                        value: league,
                        child: Text(
                          league.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      );
                    }),
                  ],
                  onChanged: (league) {
                    setState(() {
                      _selectedLeague = league;
                    });
                    _loadData();
                  },
                ),
              ),
            ),
          ),
          const Gap(10),
          // Filtro de Período
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white10),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int?>(
                  value: _selectedDays,
                  isExpanded: true,
                  dropdownColor: theme.cardColor,
                  icon: const Icon(Icons.arrow_drop_down, color: Colors.white70),
                  items: const [
                    DropdownMenuItem<int?>(
                      value: null,
                      child: Text('Todo o período', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ),
                    DropdownMenuItem<int?>(
                      value: 7,
                      child: Text('Últimos 7 dias', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ),
                    DropdownMenuItem<int?>(
                      value: 30,
                      child: Text('Últimos 30 dias', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ),
                  ],
                  onChanged: (days) {
                    setState(() {
                      _selectedDays = days;
                    });
                    _loadData();
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(ThemeData theme, Color accentColor, Color infoColor) {
    final double hitRate = _stats!.accuracyPercentage / 100.0;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: infoColor.withOpacity(0.15), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Gráfico Circular Customizado
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 110,
                    height: 110,
                    child: CustomPaint(
                      painter: CircularHitRatePainter(
                        hitRate: hitRate,
                        hitColor: Colors.green,
                        missColor: Colors.red,
                        backgroundColor: Colors.white.withOpacity(0.08),
                      ),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${_stats!.accuracyPercentage}%',
                        style: theme.textTheme.titleMedium!.copyWith(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const Text(
                        'Precisão',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.white54,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const Gap(24),
              // Números em Detalhe
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatDetailItem('Análises', _stats!.totalGames.toString(), Icons.analytics_outlined, Colors.white70),
                    const Gap(10),
                    _buildStatDetailItem('Acertos', _stats!.hits.toString(), Icons.check_circle_outline, Colors.green),
                    const Gap(10),
                    _buildStatDetailItem('Erros', _stats!.misses.toString(), Icons.cancel_outlined, Colors.red),
                  ],
                ),
              ),
            ],
          ),
          const Gap(15),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.white38, size: 14),
                const Gap(8),
                Expanded(
                  child: Text(
                    'A precisão é calculada com base nos acertos dos resultados finais (Mandante, Visitante ou Empate).',
                    style: theme.textTheme.labelSmall!.copyWith(
                      color: Colors.white38,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatDetailItem(String title, String value, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const Gap(10),
        Text(
          title,
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
        ),
      ],
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 50, color: Colors.redAccent),
          const Gap(15),
          const Text('Erro ao carregar estatísticas da IA', style: TextStyle(color: Colors.white70)),
          const Gap(10),
          ElevatedButton(
            onPressed: _loadData,
            child: const Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.analytics_outlined, size: 60, color: Colors.white24),
          const Gap(15),
          const Text(
            'Sem dados para o filtro selecionado.',
            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
          const Gap(15),
          ElevatedButton(
            onPressed: _loadData,
            child: const Text('Recarregar'),
          ),
        ],
      ),
    );
  }
}

class CircularHitRatePainter extends CustomPainter {
  final double hitRate;
  final Color hitColor;
  final Color missColor;
  final Color backgroundColor;

  CircularHitRatePainter({
    required this.hitRate,
    required this.hitColor,
    required this.missColor,
    required this.backgroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    const strokeWidth = 10.0;

    // Background track
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius - strokeWidth / 2, bgPaint);

    if (hitRate <= 0) return;

    // Hit segment (active track)
    final hitPaint = Paint()
      ..color = hitRate > 0.5 ? hitColor : Colors.orangeAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const double startAngle = -3.14159265 / 2; // top of circle
    final double sweepAngle = 2 * 3.14159265 * hitRate;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - strokeWidth / 2),
      startAngle,
      sweepAngle,
      false,
      hitPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CircularHitRatePainter oldDelegate) {
    return oldDelegate.hitRate != hitRate ||
        oldDelegate.hitColor != hitColor ||
        oldDelegate.missColor != missColor ||
        oldDelegate.backgroundColor != backgroundColor;
  }
}

class RecentAuditItem extends StatelessWidget {
  final RecentAudit audit;
  const RecentAuditItem({super.key, required this.audit});

  @override
  Widget build(BuildContext context) {
    final bool isHit = audit.isHit ?? false;
    final String dateStr = DateFormat('dd/MM/yyyy').format(audit.date);
    
    String predictedText = 'Empate';
    if (audit.predicted == 'HOME') {
      predictedText = 'Mandante (Casa)';
    } else if (audit.predicted == 'AWAY') {
      predictedText = 'Visitante (Fora)';
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isHit 
              ? Colors.green.withOpacity(0.2) 
              : Colors.red.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Liga & Data
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                audit.leagueName,
                style: context.textTheme.labelSmall!.copyWith(
                  color: Colors.white54,
                  fontSize: 11,
                ),
              ),
              Text(
                dateStr,
                style: context.textTheme.labelSmall!.copyWith(
                  color: Colors.white54,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const Gap(8),
          
          // Times & Placar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Mandante
              Expanded(
                child: Row(
                  children: [
                    if (audit.homeTeamLogo != null)
                      CachedNetworkImage(
                        imageUrl: audit.homeTeamLogo!,
                        width: 20,
                        height: 20,
                        placeholder: (context, url) => const SizedBox(width: 20, height: 20),
                        errorWidget: (context, url, error) => const Icon(Icons.shield_outlined, size: 20, color: Colors.white24),
                      )
                    else
                      const Icon(Icons.shield_outlined, size: 20, color: Colors.white24),
                    const Gap(8),
                    Expanded(
                      child: Text(
                        audit.homeTeam,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodySmall!.copyWith(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Placar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  audit.score,
                  style: context.textTheme.bodySmall!.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              
              // Visitante
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Text(
                        audit.awayTeam,
                        textAlign: TextAlign.end,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodySmall!.copyWith(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const Gap(8),
                    if (audit.awayTeamLogo != null)
                      CachedNetworkImage(
                        imageUrl: audit.awayTeamLogo!,
                        width: 20,
                        height: 20,
                        placeholder: (context, url) => const SizedBox(width: 20, height: 20),
                        errorWidget: (context, url, error) => const Icon(Icons.shield_outlined, size: 20, color: Colors.white24),
                      )
                    else
                      const Icon(Icons.shield_outlined, size: 20, color: Colors.white24),
                  ],
                ),
              ),
            ],
          ),
          
          const Divider(height: 20, color: Colors.white10),
          
          // Previsão & Auditoria Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text(
                    'Previsão: ',
                    style: TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  Text(
                    predictedText,
                    style: TextStyle(
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              
              // Badge de acerto
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isHit 
                      ? Colors.green.withOpacity(0.15) 
                      : Colors.red.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isHit ? Colors.green : Colors.red,
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isHit ? Icons.check : Icons.close,
                      color: isHit ? Colors.green : Colors.red,
                      size: 12,
                    ),
                    const Gap(4),
                    Text(
                      isHit ? 'Acertou' : 'Errou',
                      style: TextStyle(
                        color: isHit ? Colors.green : Colors.red,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
