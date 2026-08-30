part of '../screens.dart';

class TopScorersScreen extends StatefulWidget {
  const TopScorersScreen({super.key});

  @override
  State<TopScorersScreen> createState() => _TopScorersScreenState();
}

class _TopScorersScreenState extends State<TopScorersScreen> {
  final ApiClient _apiClient = ApiClient();
  List<Scorer>? _scorers;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchTopScorers();
  }

  Future<void> _fetchTopScorers() async {
    try {
      final list = await _apiClient.getScorers(140);
      if (mounted) {
        setState(() {
          _scorers = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('top_scorers'.tr(context)),
        centerTitle: true,
      ),
      body: Builder(
        builder: (context) {
          if (_isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (_error != null) {
            return Center(child: Text(_error!));
          }
          if (_scorers == null || _scorers!.isEmpty) {
            return const Center(
              child: Text(
                'Nenhum artilheiro encontrado',
                style: TextStyle(color: Colors.white70),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
            itemCount: _scorers!.length,
            separatorBuilder: (_, __) => const Gap(12),
            itemBuilder: (context, index) {
              final scorer = _scorers![index];
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
    );
  }
}
