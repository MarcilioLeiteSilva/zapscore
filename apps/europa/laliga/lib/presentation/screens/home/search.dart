part of '../screens.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<String> tabs = [
    'Destaques',
    'Partidas',
    'Competições',
    'Times',
    'Notícias',
    'Vídeos'
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
          hintText: 'Pesquisar País, Competição, Time...',
          leading: SvgPicture.asset(
            Assets.searchLine,
            color: Theme.of(context).brightness == Brightness.light ? Colors.grey : Colors.white70,
          ),
          backgroundColor: MaterialStatePropertyAll(
            Theme.of(context).brightness == Brightness.light ? Colors.grey[200] : Colors.white.withOpacity(0.1),
          ),
          textStyle: MaterialStatePropertyAll(
            GoogleFonts.urbanist(
              color: const Color(0xFF1F2937),
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          hintStyle: MaterialStatePropertyAll(
            GoogleFonts.urbanist(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
          elevation: const MaterialStatePropertyAll(0),
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
