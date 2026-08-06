part of '../screens.dart';

class ReportFixPage extends StatefulWidget {
  final String? leagueId;
  final String? teamId;
  const ReportFixPage({super.key, this.leagueId, this.teamId});

  @override
  State<ReportFixPage> createState() => _ReportFixPageState();
}

class _ReportFixPageState extends State<ReportFixPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NewsCubit>().fetchNews(leagueId: widget.leagueId, teamId: widget.teamId);
    });
  }

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
            return Center(child: Text('no_report_available'.tr(context)));
          }
          return ListView.separated(
            padding: const EdgeInsets.only(left: 10, right: 10, top: 6, bottom: 20),
            itemBuilder: (context, index) {
              return CardNewsItem(news: state.news[index]);
            },
            separatorBuilder: (context, index) => const Gap(6),
            itemCount: state.news.length,
          );
        }
        return const SizedBox();
      },
    );
  }
}
