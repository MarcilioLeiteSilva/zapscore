part of '../screens.dart';

class LivePage extends StatefulWidget {
  const LivePage({super.key});

  @override
  State<LivePage> createState() => _LivePageState();
}

class _LivePageState extends State<LivePage> {
  @override
  void initState() {
    super.initState();
    // Inicia a atualização automática ao entrar na tela (a cada 30 segundos para maior precisão)
    context.read<LiveCubit>().startAutoRefresh(seconds: 30);
  }

  @override
  void dispose() {
    // Para a atualização automática ao sair da tela para economizar recursos/bateria
    context.read<LiveCubit>().stopAutoRefresh();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Text('live'.tr(context)),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<LiveCubit>().fetchLiveFixtures(),
        child: BlocBuilder<LiveCubit, LiveState>(
          builder: (context, state) {
            if (state is LiveLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is LiveError) {
              return Center(child: Text(state.message));
            }
            if (state is LiveLoaded) {
              if (state.fixtures.isEmpty) {
                return Center(child: Text('no_games'.tr(context)));
              }

              // Agrupar jogos por liga
              final groupedFixtures = <String, List<Fixture>>{};
              final leagues = <String, League>{};

              for (var fixture in state.fixtures) {
                final league = fixture.league;
                final leagueId = league?.id.toString() ?? 'unknown';
                
                if (!groupedFixtures.containsKey(leagueId)) {
                  groupedFixtures[leagueId] = [];
                  leagues[leagueId] = league ?? League(id: '0', externalId: 0, name: 'Outros');
                }
                groupedFixtures[leagueId]!.add(fixture);
              }

              final List<HomeCompetition> competitions = groupedFixtures.entries.map((entry) {
                return HomeCompetition(
                  league: leagues[entry.key]!,
                  matches: entry.value,
                );
              }).toList();

              // Ordenar por nome da liga
              competitions.sort((a, b) => a.league.name.compareTo(b.league.name));

              return ListView.separated(
                padding: const EdgeInsets.only(
                  left: 10,
                  right: 10,
                  top: 15,
                  bottom: 100,
                ),
                itemBuilder: (_, i) {
                  final comp = competitions[i];
                  return CardGroupFixtureItem(competition: comp);
                },
                separatorBuilder: (_, i) => const Gap(20),
                itemCount: competitions.length,
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }
}
