part of '../screens.dart';

class LivePage extends StatelessWidget {
  const LivePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Text('LIVE Match'),
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
                return const Center(child: Text('Nenhum jogo ao vivo no momento'));
              }
              return ListView.separated(
                padding: const EdgeInsets.only(
                  left: 10,
                  right: 10,
                  top: 15,
                  bottom: 100,
                ),
                itemBuilder: (_, i) {
                  final fixture = state.fixtures[i];
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColor.card,
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: AppColor.info, width: 1),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 5),
                    child: CardFixtureItem(fixture: fixture, showDivider: false),
                  );
                },
                separatorBuilder: (_, i) => const Gap(20),
                itemCount: state.fixtures.length,
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }
}
