part of '../screens.dart';

class LeagueProfileScreen extends StatefulWidget {
  const LeagueProfileScreen({super.key, required this.league, this.initialIndex = 0});
  final League league;
  final int initialIndex;

  @override
  State<LeagueProfileScreen> createState() => _LeagueProfileScreenState();
}

class _LeagueProfileScreenState extends State<LeagueProfileScreen> {
  late int indexTab;

  @override
  void initState() {
    super.initState();
    indexTab = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => LeagueCubit(context.read<HomeCubit>().apiClient)
        ..fetchLeagueData(widget.league.externalId),
      child: BlocConsumer<LeagueCubit, LeagueState>(
        listener: (context, state) {
          if (state is LeagueError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: ${state.message}')),
            );
          }
        },
        builder: (context, state) {
          final cubit = context.read<LeagueCubit>();
          final currentLeagueId = state is LeagueLoaded ? state.selectedLeagueId : widget.league.externalId;
          final competition = state is LeagueLoaded ? state.competition : null;
          final phases = competition?.phases ?? [];
          final selectedPhaseId = state is LeagueLoaded ? state.selectedPhaseId : 'primeira_fase_a1';

          return Scaffold(
            appBar: AppBar(
              title: Text(
                currentLeagueId == 620
                    ? 'Cearense - Série B'
                    : 'Campeonato Cearense 2026',
              ),
              actions: [
                BlocBuilder<FavoriteCubit, FavoriteState>(
                  builder: (context, favState) {
                    final isFav = context
                        .read<FavoriteCubit>()
                        .isLeagueFavorite(currentLeagueId.toString());
                    return IconButton(
                      onPressed: () {
                        context
                            .read<FavoriteCubit>()
                            .toggleLeague(currentLeagueId.toString());
                      },
                      icon: Icon(
                        isFav ? Icons.star : Icons.star_border,
                        color: isFav ? const Color(0xFFAA7A13) : Colors.white,
                      ),
                    );
                  },
                ),
              ],
            ),
            body: Column(
              children: [
                // 1. Seletor de Divisão: [Série A] [Série B]
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  color: Theme.of(context).cardColor.withOpacity(0.4),
                  child: Row(
                    children: [
                      Expanded(
                        child: _DivisionButton(
                          title: 'Série A',
                          isSelected: currentLeagueId == 609 || currentLeagueId != 620,
                          onTap: () {
                            if (currentLeagueId != 609) {
                              cubit.switchDivision(609);
                            }
                          },
                        ),
                      ),
                      const Gap(10),
                      Expanded(
                        child: _DivisionButton(
                          title: 'Série B',
                          isSelected: currentLeagueId == 620,
                          onTap: () {
                            if (currentLeagueId != 620) {
                              cubit.switchDivision(620);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Seletor de Fases Dinâmicas
                if (phases.isNotEmpty) ...[
                  Container(
                    width: context.width,
                    height: 48,
                    color: Theme.of(context).scaffoldBackgroundColor,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      itemCount: phases.length,
                      separatorBuilder: (_, __) => const Gap(8),
                      itemBuilder: (context, i) {
                        final phase = phases[i];
                        final isSelected = phase.id == selectedPhaseId;
                        return InkWell(
                          onTap: () {
                            cubit.selectPhase(phase.id);
                            setState(() {
                              indexTab = 0;
                            });
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColor.accent
                                  : Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected
                                    ? AppColor.accent
                                    : Theme.of(context).dividerColor.withOpacity(0.1),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                phase.name,
                                style: GoogleFonts.urbanist(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  color: isSelected
                                      ? Colors.white
                                      : Theme.of(context).colorScheme.onSurface,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],

                // 3. Abas Principais Dinâmicas (Classificação/Rodadas/Jogos/Artilharia ou apenas Jogos/Artilharia)
                Builder(
                  builder: (context) {
                    final activePhase = state is LeagueLoaded ? state.activePhase : null;
                    final isKnockout = activePhase != null && activePhase.isKnockout;
                    final tabs = isKnockout
                        ? ["Jogos", "Artilharia"]
                        : ["Classificação", "Rodadas", "Jogos", "Artilharia"];
                    final safeIndex = indexTab.clamp(0, tabs.length - 1);

                    return Container(
                      width: context.width,
                      height: 52,
                      color: Theme.of(context).scaffoldBackgroundColor,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Material(
                        color: Colors.transparent,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          itemBuilder: (_, i) {
                            return CardCheepTabSearch(
                              select: safeIndex == i,
                              label: tabs[i],
                              onTap: () {
                                setState(() {
                                  indexTab = i;
                                });
                              },
                            );
                          },
                          separatorBuilder: (_, i) => const Gap(10),
                          itemCount: tabs.length,
                        ),
                      ),
                    );
                  },
                ),

                // 4. Conteúdo das Abas
                Builder(
                  builder: (context) {
                    final activePhase = state is LeagueLoaded ? state.activePhase : null;
                    final isKnockout = activePhase != null && activePhase.isKnockout;
                    final tabsCount = isKnockout ? 2 : 4;
                    final safeIndex = indexTab.clamp(0, tabsCount - 1);

                    return Expanded(
                      child: isKnockout
                          ? [
                              const MatchLeaguePage(),
                              const TopScoreLeaguePage(),
                            ][safeIndex]
                          : [
                              const TableLeaguePage(),
                              const RoundLeaguePage(),
                              const MatchLeaguePage(),
                              const TopScoreLeaguePage(),
                            ][safeIndex],
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _DivisionButton extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback onTap;

  const _DivisionButton({
    required this.title,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColor.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColor.accent : Theme.of(context).dividerColor.withOpacity(0.2),
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: GoogleFonts.urbanist(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
