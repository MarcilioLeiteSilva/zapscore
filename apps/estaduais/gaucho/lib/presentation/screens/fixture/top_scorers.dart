part of '../screens.dart';

class TopScorersScreen extends StatefulWidget {
  const TopScorersScreen({super.key});

  @override
  State<TopScorersScreen> createState() => _TopScorersScreenState();
}

class _TopScorersScreenState extends State<TopScorersScreen> {
  final ApiClient _apiClient = ApiClient();
  int _selectedLeagueId = AppConfig.gauchoSerieAId;
  final Map<int, List<Scorer>> _scorersCache = {};
  final Map<int, bool> _loadingMap = {};
  final Map<int, String?> _errorMap = {};

  final List<Map<String, dynamic>> _leagues = [
    {'id': AppConfig.gauchoSerieAId, 'name': 'Série A'},
    {'id': AppConfig.gauchoDivisaoAcessoId, 'name': 'Acesso'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchTopScorers(AppConfig.gauchoSerieAId);
  }

  Future<void> _fetchTopScorers(int leagueId) async {
    if (_scorersCache.containsKey(leagueId)) return;
    setState(() {
      _loadingMap[leagueId] = true;
      _errorMap[leagueId] = null;
    });
    try {
      final list = await _apiClient.getScorers(leagueId);
      if (mounted) {
        setState(() {
          _scorersCache[leagueId] = list;
          _loadingMap[leagueId] = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMap[leagueId] = e.toString();
          _loadingMap[leagueId] = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentScorers = _scorersCache[_selectedLeagueId] ?? [];
    final bool isLoading = _loadingMap[_selectedLeagueId] == true;
    final String? error = _errorMap[_selectedLeagueId];

    return Scaffold(
      appBar: AppBar(
        title: Text('top_scorers'.tr(context)),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Seletor de Abas Série A e Série A2
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColor.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColor.info, width: 1),
            ),
            child: Row(
              children: _leagues.map((item) {
                final int id = item['id'];
                final String name = item['name'];
                final bool isSelected = _selectedLeagueId == id;
                return Expanded(
                  child: InkWell(
                    onTap: () {
                      setState(() => _selectedLeagueId = id);
                      _fetchTopScorers(id);
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? context.appColors.darkGreen : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? Colors.white : Colors.white60,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: Builder(
              builder: (context) {
                if (isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (error != null) {
                  return Center(child: Text(error));
                }
                if (currentScorers.isEmpty) {
                  return const Center(
                    child: Text(
                      'Nenhum artilheiro encontrado',
                      style: TextStyle(color: Colors.white70),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  itemCount: currentScorers.length,
                  separatorBuilder: (_, __) => const Gap(12),
                  itemBuilder: (context, index) {
                    final scorer = currentScorers[index];
                    return Ink(
                      decoration: BoxDecoration(
                        color: AppColor.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColor.info, width: 1),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: CardTopScores(
                        scorer: scorer,
                        rank: index + 1,
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
