part of 'widgets.dart';

class MatchLeaguePage extends StatefulWidget {
  const MatchLeaguePage({super.key});

  @override
  State<MatchLeaguePage> createState() => _MatchLeaguePageState();
}

class _MatchLeaguePageState extends State<MatchLeaguePage> {
  int _tacaRioSubStage = 0; // 0: Semifinais, 1: Final

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          final activePhase = state.activePhase;

          // 1. Taça Rio: seletor com setas, exibe jogos agrupados por confronto (sem agregado)
          if (activePhase != null && activePhase.id == 'taca_rio') {
            // Separa ties de semi e final
            final semiTies = activePhase.ties
                .where((t) => t.id.contains('semi') || t.title.contains('Semifinal'))
                .toList();
            final finalTies = activePhase.ties
                .where((t) => t.id.contains('final') && !t.id.contains('semi') && !t.title.contains('Semifinal'))
                .toList();

            final currentTies = _tacaRioSubStage == 0 ? semiTies : finalTies;

            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 10, bottom: 120),
              children: [
                // Card seletor com setas
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        onPressed: _tacaRioSubStage > 0 ? () => setState(() => _tacaRioSubStage = 0) : null,
                        icon: Icon(Icons.arrow_back_ios, size: 18,
                          color: _tacaRioSubStage > 0 ? null : Colors.white24),
                      ),
                      Expanded(
                        child: Text(
                          _tacaRioSubStage == 0 ? 'Taça Rio (Semifinais)' : 'Taça Rio (Final)',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                      IconButton(
                        onPressed: _tacaRioSubStage < 1 ? () => setState(() => _tacaRioSubStage = 1) : null,
                        icon: Icon(Icons.arrow_forward_ios, size: 18,
                          color: _tacaRioSubStage < 1 ? null : Colors.white24),
                      ),
                    ],
                  ),
                ),
                // Exibe jogos agrupados por confronto (tie), sem placar agregado
                if (currentTies.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Text(
                        'Confrontos a definir pelos eliminados das Quartas de Final.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(color: Colors.white54, fontSize: 13),
                      ),
                    ),
                  )
                else
                  for (final tie in currentTies) ...[
                    _SectionLabel(label: tie.title),
                    if (tie.leg1 != null) CardFixtureLeagueItem(fixture: tie.leg1!),
                    if (tie.leg2 != null) ...[
                      const Gap(10),
                      CardFixtureLeagueItem(fixture: tie.leg2!),
                    ],
                    const Gap(16),
                  ],
              ],
            );
          }

          // 2. Semifinais do Cearense: exibe jogos agrupados por confronto
          if (activePhase != null && activePhase.id == 'semi_finals_a1') {
            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 10, bottom: 120),
              children: [
                if (activePhase.ties.isEmpty && activePhase.fixtures.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Text(
                        'Semifinais definidas pelos vencedores das Quartas de Final.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(color: Colors.white54, fontSize: 13),
                      ),
                    ),
                  )
                else
                  for (final tie in activePhase.ties) ...[
                    _SectionLabel(label: tie.title),
                    if (tie.leg1 != null) CardFixtureLeagueItem(fixture: tie.leg1!),
                    if (tie.leg2 != null) ...[
                      const Gap(10),
                      CardFixtureLeagueItem(fixture: tie.leg2!),
                    ],
                    const Gap(16),
                  ],
              ],
            );
          }

          // 3. Quartas de Final e Final: exibe cards de confronto (CompetitionBracketWidget)
          if (activePhase != null && activePhase.isKnockout) {
            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 10, bottom: 120),
              children: [
                CompetitionBracketWidget(
                  ties: activePhase.ties,
                  phaseDescription: activePhase.qualificationRuleDescription,
                ),
              ],
            );
          }

          // 4. Fases Regulares (Taça Guanabara, Quadrangular de Rebaixamento)
          final List<Fixture> phaseFixtures = (activePhase != null && activePhase.fixtures.isNotEmpty)
              ? activePhase.fixtures
              : state.fixtures;

          if (phaseFixtures.isEmpty) {
            return Center(
              child: Text(
                'Nenhum jogo disponível nesta fase.',
                style: GoogleFonts.urbanist(color: Colors.white70),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.only(left: 10, right: 10, top: 10, bottom: 120),
            itemBuilder: (_, i) {
              final fix = phaseFixtures[i];
              if (i > 0 && i % 4 == 0) {
                return Column(
                  children: [
                    const AppNativeAdWidget(variant: NativeAdVariant.fixture),
                    const Gap(10),
                    CardFixtureLeagueItem(fixture: fix),
                  ],
                );
              }
              return CardFixtureLeagueItem(fixture: fix);
            },
            separatorBuilder: (_, i) => const Gap(10),
            itemCount: phaseFixtures.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

/// Label de seção para separar confrontos nas fases eliminatórias
class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColor.accent.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColor.accent.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: GoogleFonts.urbanist(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: AppColor.accent,
          ),
        ),
      ),
    );
  }
}

class CardMatchLeague extends StatelessWidget {
  const CardMatchLeague({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          DateFormat('EEEE, d MMMM', context.read<SettingCubit>().state.language).format(DateTime.now()),
          style: context.textTheme.bodySmall,
        ),
        const Gap(15),
        ListView.separated(
          shrinkWrap: true,
          physics: const ScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            vertical: 10,
            horizontal: 10,
          ),
          itemBuilder: (_, i) {
            return Ink(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(15),
              ),
              child: const CardFollowItem(),
            );
          },
          separatorBuilder: (_, i) => const Gap(15),
          itemCount: 3,
        ),
      ],
    );
  }
}

class OverviewPage extends StatelessWidget {
  const OverviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            children: [
              const Gap(10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Jogos Recentes',
                    style: context.textTheme.bodySmall,
                  ),
                ],
              ),
              const Gap(5),
              ListView.separated(
                shrinkWrap: true,
                physics: const ScrollPhysics(),
                padding: EdgeInsets.zero,
                itemBuilder: (_, i) {
                  final fix = state.fixtures[i];
                  return Ink(
                    width: context.width,
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      borderRadius: BorderRadius.circular(15),
                      border: Border(
                        bottom: BorderSide(
                          color: context.appColors.info ?? Colors.transparent,
                          width: 1,
                        ),
                      ),
                    ),
                    padding: const EdgeInsets.only(
                      left: 15,
                      top: 15,
                      bottom: 10,
                    ),
                    child: CardFixtureItem(
                      fixture: fix,
                      showDivider: false,
                    ),
                  );
                },
                separatorBuilder: (_, i) => const Gap(10),
                itemCount: state.fixtures.length > 3 ? 3 : state.fixtures.length,
              ),
              const Gap(20),
              Text(
                'Melhores Marcadores',
                style: context.textTheme.bodySmall,
              ),
              const Gap(20),
              Container(
                width: context.width,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                padding:
                    const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const ScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemBuilder: (_, i) {
                    final scorer = state.scorers[i];
                    return CardTopScores(scorer: scorer, rank: i + 1);
                  },
                  separatorBuilder: (_, i) => const Divider(height: 30),
                  itemCount: state.scorers.length > 5 ? 5 : state.scorers.length,
                ),
              ),
              const Gap(50),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class CardTopScores extends StatelessWidget {
  const CardTopScores({super.key, this.scorer, required this.rank});
  final Scorer? scorer;
  final int rank;

  @override
  Widget build(BuildContext context) {
    if (scorer == null) return const SizedBox();
    final item = scorer!;
    final pId = (item.externalPlayerId != null && item.externalPlayerId! > 0)
        ? item.externalPlayerId.toString()
        : (item.playerPhoto != null && item.playerPhoto!.contains('/players/'))
            ? RegExp(r'/players/(\d+)\.png').firstMatch(item.playerPhoto!)?.group(1) ?? '0'
            : '0';

    return InkWell(
      onTap: pId != '0'
          ? () => context.pushNamed(
                screenPlayer,
                queryParameters: {
                  'id': pId,
                  'name': item.playerName,
                },
              )
          : null,
      child: Row(
        children: [
          SizedBox(
            width: 25,
            child: Text(
              '$rank',
              style: context.textTheme.bodySmall!.copyWith(
                fontWeight: FontWeight.bold,
                color: rank <= 3 ? Theme.of(context).primaryColor : null,
              ),
            ),
          ),
          const Gap(5),
          SizedBox(
            width: 40,
            height: 40,
            child: item.playerPhoto != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: CachedNetworkImage(imageUrl: proxyImage(item.playerPhoto!), fit: BoxFit.cover),
                  )
                : CircleAvatar(
                    backgroundColor: context.appColors.info,
                    child: const Icon(Icons.person, color: Colors.white54),
                  ),
          ),
          const Gap(10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.playerName,
                  style: context.textTheme.bodySmall!.copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    if (item.teamLogo != null) ...[
                      CachedNetworkImage(imageUrl: proxyImage(item.teamLogo!), width: 14, height: 14),
                      const Gap(5),
                    ],
                    Expanded(
                      child: Text(
                        item.teamName,
                        style: context.textTheme.labelSmall!.copyWith(
                          color: Colors.white54,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            '${item.goals} ${'goals'.tr(context)}',
            style: context.textTheme.bodySmall!.copyWith(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class TableLeaguePage extends StatelessWidget {
  const TableLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          final activePhase = state.activePhase;

          // 1. Fase de Grupos (ex: Taça Guanabara - Grupo A e Grupo B)
          if (activePhase != null && activePhase.isGroupStage && activePhase.groups.isNotEmpty) {
            final groupIndex = state.selectedGroupIndex.clamp(0, activePhase.groups.length - 1);
            final currentGroup = activePhase.groups[groupIndex];

            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 15, bottom: 120),
              children: [
                // Switcher [Grupo A] [Grupo B]
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      for (int i = 0; i < activePhase.groups.length; i++) ...[
                        if (i > 0) const Gap(10),
                        Expanded(
                          child: InkWell(
                            onTap: () => context.read<LeagueCubit>().selectGroup(i),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: state.selectedGroupIndex == i
                                    ? AppColor.accent
                                    : Theme.of(context).cardColor,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                activePhase.groups[i].name,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.urbanist(
                                  fontWeight: FontWeight.bold,
                                  color: state.selectedGroupIndex == i
                                      ? Colors.white
                                      : Theme.of(context).colorScheme.onSurface,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                StandingsTableWidget(
                  standings: currentGroup.standings,
                  groupTitle: currentGroup.name,
                  qualificationCount: 4,
                  relegationCount: 2,
                  qualificationDescription: '1º a 4º avançam para as Quartas de Final da Série A1.',
                  relegationDescription: '5º e 6º disputam o Quadrangular do Rebaixamento.',
                ),
              ],
            );
          }

          // 2. Quadrangular do Rebaixamento
          if (activePhase != null && activePhase.isRelegation) {
            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 15, bottom: 120),
              children: [
                StandingsTableWidget(
                  standings: activePhase.standings,
                  groupTitle: activePhase.name,
                  qualificationCount: 0,
                  relegationCount: 1,
                  relegationDescription: '4º colocado é rebaixado para a Série A2 de 2027.',
                ),
              ],
            );
          }

          // 3. Fases de Mata-Mata / Eliminatórias (Quartas, Semis, Final, Taça Rio)
          if (activePhase != null && activePhase.isKnockout) {
            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 15, bottom: 120),
              children: [
                CompetitionBracketWidget(
                  ties: activePhase.ties,
                  phaseDescription: activePhase.qualificationRuleDescription,
                ),
              ],
            );
          }

          // 4. Pontos Corridos / Liga Única (ex: Taça Santos Dumont A2)
          if (activePhase != null && activePhase.isLeague) {
            final isA2 = state.selectedLeagueId == 851;
            return ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 15, bottom: 120),
              children: [
                StandingsTableWidget(
                  standings: activePhase.standings.isNotEmpty ? activePhase.standings : state.standings,
                  groupTitle: activePhase.name,
                  qualificationCount: 4,
                  relegationCount: isA2 ? 2 : 0,
                  qualificationDescription: '1º a 4º colocados avançam para as Semifinais.',
                  relegationDescription: isA2 ? '11º e 12º colocados são rebaixados para a Série B1 de 2027.' : null,
                ),
              ],
            );
          }

          // 5. Fallback padrão
          return ListView(
            padding: const EdgeInsets.only(left: 10, right: 10, top: 15, bottom: 120),
            children: [
              StandingsTableWidget(
                standings: state.standings,
                groupTitle: 'Classificação Geral',
              ),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class TableTileItem extends StatelessWidget {
  const TableTileItem(
    this.text, {
    super.key,
    this.padding,
    this.isTop = false,
    this.isCrossCenter = false,
    this.style,
  });
  final String text;
  final EdgeInsetsGeometry? padding;
  final bool isTop;
  final bool isCrossCenter;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? EdgeInsets.symmetric(vertical: isTop ? 10 : 15),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: isCrossCenter
            ? CrossAxisAlignment.center
            : CrossAxisAlignment.start,
        children: [
          Text(text, style: GoogleFonts.urbanist(textStyle: style ?? const TextStyle(fontSize: 15))),
          if (isTop) ...[
            const Gap(3),
            Container(
              width: 28,
              height: 5,
              decoration: const BoxDecoration(
                  color: AppColor.primary,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(4),
                    topRight: Radius.circular(4),
                  )),
            ),
          ]
        ],
      ),
    );
  }
}

class NewsLeaguePage extends StatelessWidget {
  const NewsLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NewsCubit, NewsState>(
      builder: (context, state) {
        if (state is NewsLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is NewsError) {
          return Center(child: Text(state.message));
        }
        if (state is NewsLoaded) {
          if (state.news.isEmpty) {
            return Center(child: Text('no_news_competition'.tr(context)));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            itemBuilder: (_, i) {
              return CardNewsItem(news: state.news[i]);
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: state.news.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

class RoundLeaguePage extends StatelessWidget {
  const RoundLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          final cubit = context.read<LeagueCubit>();
          final activePhase = state.activePhase;

          // Se for fase eliminatória sem rodadas numeradas (ex: Quartas, Semis, Final, Taça Rio)
          if (activePhase != null && activePhase.isKnockout) {
            final fixtures = activePhase.fixtures;
            if (fixtures.isEmpty) {
              return Center(
                child: Text(
                  'Confrontos definidos pelo chaveamento.',
                  style: GoogleFonts.urbanist(color: Colors.white70),
                ),
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.only(left: 10, right: 10, top: 10, bottom: 120),
              itemBuilder: (_, i) => CardFixtureLeagueItem(fixture: fixtures[i]),
              separatorBuilder: (_, i) => const Gap(10),
              itemCount: fixtures.length,
            );
          }

          // Para fases com rodadas (Taça Guanabara, Quadrangular, Taça Santos Dumont)
          final availableFixtures = (activePhase != null && activePhase.fixtures.isNotEmpty)
              ? activePhase.fixtures
              : state.fixtures;

          final roundFixtures = availableFixtures
              .where((f) => f.round == state.selectedRound)
              .toList();

          final displayFixtures = roundFixtures.isNotEmpty
              ? roundFixtures
              : (availableFixtures.isNotEmpty ? availableFixtures : <Fixture>[]);

          final phaseRounds = cubit.currentPhaseRounds;
          final currentIndex = phaseRounds.indexOf(state.selectedRound);
          final hasPrev = currentIndex > 0;
          final hasNext = currentIndex != -1 && currentIndex < phaseRounds.length - 1;

          return Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      onPressed: hasPrev ? cubit.prevRound : null,
                      icon: Icon(
                        Icons.arrow_back_ios,
                        size: 18,
                        color: hasPrev ? null : Colors.white24,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        formatRound(state.selectedRound, context),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: hasNext ? cubit.nextRound : null,
                      icon: Icon(
                        Icons.arrow_forward_ios,
                        size: 18,
                        color: hasNext ? null : Colors.white24,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: displayFixtures.isEmpty
                    ? Center(
                        child: Text(
                          'Nenhum jogo nesta rodada.',
                          style: GoogleFonts.urbanist(color: Colors.white70),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.only(left: 10, right: 10, top: 10, bottom: 120),
                        itemBuilder: (_, i) {
                          final fix = displayFixtures[i];
                          if (i > 0 && i % 4 == 0) {
                            return Column(
                              children: [
                                const AppNativeAdWidget(variant: NativeAdVariant.fixture),
                                const Gap(10),
                                CardFixtureLeagueItem(fixture: fix),
                              ],
                            );
                          }
                          return CardFixtureLeagueItem(fixture: fix);
                        },
                        separatorBuilder: (_, i) => const Gap(10),
                        itemCount: displayFixtures.length,
                      ),
              ),
            ],
          );
        }
        return const SizedBox();
      },
    );
  }
}

class CardFixtureLeagueItem extends StatelessWidget {
  final Fixture fixture;
  const CardFixtureLeagueItem({super.key, required this.fixture});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy HH:mm', context.read<SettingCubit>().state.language).format(fixture.date);
    return Ink(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 15, top: 10, right: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  formatRound(fixture.round, context),
                  style: context.textTheme.labelSmall!.copyWith(
                    color: Colors.white54,
                  ),
                ),
                Text(
                  dateStr,
                  style: context.textTheme.labelSmall!.copyWith(
                    color: Colors.white54,
                  ),
                ),
              ],
            ),
          ),
          CardFixtureItem(
            fixture: fixture,
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class TopScoreLeaguePage extends StatelessWidget {
  const TopScoreLeaguePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const TopScoresList();
  }
}

class TopScoresList extends StatelessWidget {
  const TopScoresList({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        if (state is LeagueLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LeagueLoaded) {
          return ListView.separated(
            shrinkWrap: true,
            physics: const ScrollPhysics(),
            padding: const EdgeInsets.only(left: 10, right: 10, top: 15, bottom: 120),
            itemBuilder: (_, i) {
              final scorer = state.scorers[i];
              return Ink(
                width: context.width,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(15),
                ),
                padding:
                    const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
                child: CardTopScores(scorer: scorer, rank: i + 1),
              );
            },
            separatorBuilder: (_, i) => const Gap(15),
            itemCount: state.scorers.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}

class TopScoreAllPage extends StatelessWidget {
  const TopScoreAllPage({super.key, required this.onTap});
  final Function(int) onTap;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 10),
      children: [
        CardTopScoreItem(
          label: 'GOALS',
          onAll: () {
            onTap(0);
          },
        ),
        const Gap(20),
        CardTopScoreItem(
          label: 'ASSITS',
          onAll: () {
            onTap(1);
          },
        ),
        const Gap(20),
        CardTopScoreItem(
          label: 'YELLOW CARDS',
          onAll: () {
            onTap(2);
          },
        ),
        const Gap(20),
        CardTopScoreItem(
          label: 'RED CARDS',
          onAll: () {
            onTap(3);
          },
        ),
      ],
    );
  }
}

class CardTopScoreItem extends StatelessWidget {
  const CardTopScoreItem({super.key, required this.label, required this.onAll});
  final String label;
  final Function() onAll;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LeagueCubit, LeagueState>(
      builder: (context, state) {
        return Ink(
          width: context.width,
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(15),
          ),
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: context.textTheme.bodySmall,
              ),
              const Divider(height: 30),
              if (state is LeagueLoaded && label == 'GOALS')
                ListView.separated(
                  shrinkWrap: true,
                  physics: const ScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemBuilder: (_, i) {
                    final scorer = state.scorers[i];
                    return CardTopScores(scorer: scorer, rank: i + 1);
                  },
                  separatorBuilder: (_, i) => const Divider(height: 30),
                  itemCount: state.scorers.length > 5 ? 5 : state.scorers.length,
                )
              else
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Text('no_data_available'.tr(context)),
                  ),
                ),
              const Divider(height: 30),
              Center(
                child: InkWell(
                  onTap: onAll,
                  child: Text(
                    'Ver Tudo',
                    style: context.textTheme.bodySmall!.copyWith(
                      color: Theme.of(context).primaryColor,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
