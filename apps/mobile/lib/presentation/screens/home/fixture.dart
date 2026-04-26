part of '../screens.dart';

class FixturePage extends StatelessWidget {
  const FixturePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<SettingCubit, SettingState>(
      listenWhen: (previous, current) => previous.selectedDate != current.selectedDate,
      listener: (context, settingState) {
        final today = DateTime.now();
        final isToday = settingState.selectedDate.day == today.day && 
                        settingState.selectedDate.month == today.month && 
                        settingState.selectedDate.year == today.year;
        context.read<HomeCubit>().fetchHomeData(date: isToday ? null : settingState.selectedDate);
      },
      child: BlocBuilder<HomeCubit, HomeState>(
        builder: (context, state) {
          final List<League> leagues = [];
          if (state is HomeLoaded) {
            leagues.addAll(state.competitions.map((e) => e.league));
          }

        return Scaffold(
          drawer: const AppDrawer(),
          body: NestedScrollView(
            headerSliverBuilder: (_, ie) {
              return [
                SliverAppBar(
                  title: const Text(AppText.appName),
                  centerTitle: false,
                  pinned: true,
                  actions: [
                    IconButton(
                      onPressed: () => context.pushNamed(screenSearch),
                      icon: SvgPicture.asset(
                        Assets.searchLine,
                        color: Colors.white,
                        height: 25,
                      ),
                    ),
                    IconButton(
                      onPressed: () {},
                      icon: SvgPicture.asset(
                        Assets.bell,
                        color: Colors.white,
                        height: 24,
                      ),
                    ),
                  ],
                ),
                SliverAppBar(
                  automaticallyImplyLeading: false,
                  expandedHeight: 130,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CardSlideLeagueHome(leagues: leagues),
                        const Gap(15),
                        const CardCalendarHome(),
                      ],
                    ),
                  ),
                ),
                BlocBuilder<SettingCubit, SettingState>(
                  builder: (context, settingState) {
                    if (!settingState.showCalendar) {
                      return const SliverToBoxAdapter();
                    }
                    return SliverPersistentHeader(
                      delegate: MyHeaderDelegate(settingState.selectedDate),
                    );
                  },
                ),
              ];
            },
            body: RefreshIndicator(
              onRefresh: () => context.read<HomeCubit>().fetchHomeData(),
              child: Builder(
                builder: (context) {
                  if (state is HomeLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state is HomeError) {
                    return Center(child: Text(state.message));
                  }
                  if (state is HomeLoaded) {
                    return ListView.separated(
                      padding: const EdgeInsets.only(
                        left: 10,
                        right: 10,
                        bottom: 120,
                      ),
                      itemBuilder: (_, i) {
                        final comp = state.competitions[i];
                        return CardGroupFixtureItem(competition: comp);
                      },
                      separatorBuilder: (_, i) => const Gap(20),
                      itemCount: state.competitions.length,
                    );
                  }
                  return const SizedBox();
                },
              ),
            ),
          ),
        );
      },
    ),
  );
}
}

class MyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final DateTime selectedDate;
  MyHeaderDelegate(this.selectedDate);

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Padding(
      padding: const EdgeInsets.only(left: 15, right: 10, bottom: 20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: SfDateRangePicker(
          onSelectionChanged: (DateRangePickerSelectionChangedArgs value) {
            var date = value.value as DateTime;
            context.read<SettingCubit>().updateCalendarDate(date);
          },
          selectionMode: DateRangePickerSelectionMode.single,
          backgroundColor: AppColor.info,
          allowViewNavigation: true,
          enableMultiView: false,
          headerHeight: 60,
          headerStyle: DateRangePickerHeaderStyle(
            backgroundColor: AppColor.info,
            textStyle: context.textTheme.bodySmall,
          ),
          showNavigationArrow: true,
          initialSelectedDate: selectedDate,
          selectionTextStyle: context.textTheme.bodySmall,
        ),
      ),
    );
  }

  @override
  double get maxExtent => 400.0;

  @override
  double get minExtent => 20.0;

  @override
  bool shouldRebuild(SliverPersistentHeaderDelegate oldDelegate) {
    return false;
  }
}
