import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'helpers/helpers.dart';
import 'repository/api/api_client.dart';
import 'logic/cubits/setting/setting_cubit.dart';
import 'logic/cubits/home/home_cubit.dart';
import 'logic/cubits/live/live_cubit.dart';
import 'logic/cubits/favorite/favorite_cubit.dart';
import 'logic/cubits/search/search_cubit.dart';
import 'logic/cubits/news/news_cubit.dart';
import 'logic/cubits/video/video_cubit.dart';
import 'repository/locale/favorite_repository.dart';

import 'repository/locale/user_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt', null);
  await initializeDateFormatting('en', null);
  await initializeDateFormatting('es', null);
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final ApiClient apiClient = ApiClient();
  final FavoriteRepository favoriteRepository = FavoriteRepository();
  final UserRepository userRepository = UserRepository();
  MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<SettingCubit>(
          create: (BuildContext context) =>
              SettingCubit(userRepository: userRepository),
        ),
        BlocProvider<HomeCubit>(
          create: (BuildContext context) =>
              HomeCubit(apiClient)..fetchHomeData(),
        ),
        BlocProvider<LiveCubit>(
          create: (BuildContext context) =>
              LiveCubit(apiClient)..fetchLiveFixtures()..startAutoRefresh(seconds: 45),
        ),
        BlocProvider<FavoriteCubit>(
          create: (BuildContext context) => FavoriteCubit(
            favoriteRepository: favoriteRepository,
            apiClient: apiClient,
          )..init(),
        ),
        BlocProvider<SearchCubit>(
          create: (BuildContext context) => SearchCubit(apiClient),
        ),
        BlocProvider<NewsCubit>(
          create: (BuildContext context) => NewsCubit(apiClient)..fetchNews(),
        ),
        BlocProvider<VideoCubit>(
          create: (BuildContext context) => VideoCubit(apiClient)..fetchVideos(),
        ),
      ],
      child: BlocBuilder<SettingCubit, SettingState>(
        builder: (context, state) {
          return MaterialApp.router(
            routerConfig: RouterApp.router,
            title: AppText.appName,
            theme: AppTheme.getTheme(context, state.theme),
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('pt'),
              Locale('en'),
              Locale('es'),
            ],
            locale: Locale(state.language),
            builder: EasyLoading.init(),
          );
        },
      ),
    );
  }
}
