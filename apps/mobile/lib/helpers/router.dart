part of 'helpers.dart';

const String screenWelcome = 'welcome';
const String screenLogin = 'login';
const String screenRegister = 'register';
const String screenProfile = 'profile';
const String screenFollow = 'follow';
const String screenRestPass = 'rest-password';

const String screenHome = 'home';
const String screenLive = 'live';
const String screenSearch = 'search';
const String screenFixtureDetails = 'fixture-details';
const String screenLeague = 'league-profile';
const String screenTeam = 'team-profile';
const String screenPlayer = 'player-profile';

const String screenNewsContent = 'news-content';
const String screenWatchContent = 'watch-content';

const String screenAbout = "about-sett";
const String screenAiPerformance = "ai-performance";
const String screenEditInfo = "editinfo-sett";
const String screenGeneral = "general-sett";
const String screenHelpCenter = "help-center-sett";
const String screenEditNotification = "editnotif-sett";
const String screenSecurity = "securty-sett";
const String screenLanguages = "languages-sett";
const String screenTheme = "theme-sett";

abstract class RouterApp {
  static final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/$screenWelcome',
        name: screenWelcome,
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/$screenLogin',
        name: screenLogin,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/$screenRegister',
        name: screenRegister,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/$screenProfile',
        name: screenProfile,
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/$screenFollow',
        name: screenFollow,
        builder: (context, state) => const FollowScreen(),
      ),
      GoRoute(
        path: '/$screenRestPass',
        name: screenRestPass,
        builder: (context, state) => const RestPasswordScreen(),
      ),
      GoRoute(
        path: '/$screenHome',
        name: screenHome,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/$screenLive',
        name: screenLive,
        builder: (context, state) => const LivePage(),
      ),
      GoRoute(
        path: '/$screenSearch',
        name: screenSearch,
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/$screenFixtureDetails',
        name: screenFixtureDetails,
        builder: (context, state) =>
            FixtureDetails(fixture: state.extra as Fixture),
      ),
      GoRoute(
        path: '/$screenLeague',
        name: screenLeague,
        builder: (context, state) =>
            LeagueProfileScreen(league: state.extra as League),
      ),
      GoRoute(
        path: '/$screenTeam',
        name: screenTeam,
        builder: (context, state) {
          final team = state.extra as Team;
          final leagueId = int.tryParse(state.uri.queryParameters['leagueId'] ?? '');
          return TeamProfileScreen(team: team, leagueId: leagueId);
        },
      ),
      GoRoute(
        path: '/$screenNewsContent',
        name: screenNewsContent,
        builder: (context, state) => NewsContentScreen(news: state.extra as News),
      ),
      GoRoute(
        path: '/$screenWatchContent',
        name: screenWatchContent,
        builder: (context, state) => WatchContentScreen(video: state.extra as Video),
      ),
      GoRoute(
        path: '/$screenAbout',
        name: screenAbout,
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: '/$screenEditInfo',
        name: screenEditInfo,
        builder: (context, state) => const EditInfoScreen(),
      ),
      GoRoute(
        path: '/$screenGeneral',
        name: screenGeneral,
        builder: (context, state) => const GeneralScreen(),
      ),
      GoRoute(
        path: '/$screenHelpCenter',
        name: screenHelpCenter,
        builder: (context, state) => const HelpCenterScreen(),
      ),
      GoRoute(
        path: '/$screenEditNotification',
        name: screenEditNotification,
        builder: (context, state) => const EditNotifScreen(),
      ),
      GoRoute(
        path: '/$screenSecurity',
        name: screenSecurity,
        builder: (context, state) => const SecurityScreen(),
      ),
      GoRoute(
        path: '/$screenLanguages',
        name: screenLanguages,
        builder: (context, state) => const LanguagesScreen(),
      ),
      GoRoute(
        path: '/$screenTheme',
        name: screenTheme,
        builder: (context, state) => const ThemeScreen(),
      ),
      GoRoute(
        path: '/$screenAiPerformance',
        name: screenAiPerformance,
        builder: (context, state) => const AiPerformanceDashboardPage(),
      ),
      GoRoute(
        path: '/$screenPlayer',
        name: screenPlayer,
        builder: (context, state) {
          final id = int.tryParse(state.uri.queryParameters['id'] ?? '0') ?? 0;
          final name = state.uri.queryParameters['name'];
          return PlayerProfileScreen(playerId: id, playerName: name);
        },
      ),
    ],
  );
}
