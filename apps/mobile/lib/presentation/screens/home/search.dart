part of '../screens.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<String> tabs = [
    'Top',
    'Matches',
    'Competitions',
    'Teams',
    'News',
    'Video'
  ];
  int indexPage = 0;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: SearchBar(
          controller: _searchController,
          onChanged: (value) {
            context.read<SearchCubit>().search(value);
          },
          hintText: 'search Country, Competition, etc',
          leading: SvgPicture.asset(Assets.searchLine),
          keyboardType: TextInputType.name,
          padding: const MaterialStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 15)),
        ),
        bottom: PreferredSize(
          preferredSize: Size(context.width, 50),
          child: SizedBox(
            width: context.width,
            height: 50,
            child: ListView.separated(
              padding: const EdgeInsets.only(top: 14, left: 10, right: 10),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, i) {
                return CardCheepTabSearch(
                  select: i == indexPage,
                  label: tabs[i],
                  onTap: () {
                    setState(() {
                      indexPage = i;
                    });
                  },
                );
              },
              separatorBuilder: (_, i) => const Gap(10),
              itemCount: tabs.length,
            ),
          ),
        ),
      ),
      body: const [
        PagePopularSearch(),
        PageSearchFixture(),
        PageSearchCompetition(),
        PageSearchTeams(),
        PageSearchNews(),
        PageSearchWatch(),
      ][indexPage],
    );
  }
}
