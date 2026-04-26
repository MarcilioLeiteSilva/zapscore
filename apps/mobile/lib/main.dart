import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
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

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final ApiClient apiClient = ApiClient();
  final FavoriteRepository favoriteRepository = FavoriteRepository();
  MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<SettingCubit>(
          create: (BuildContext context) => SettingCubit(),
        ),
        BlocProvider<HomeCubit>(
          create: (BuildContext context) =>
              HomeCubit(apiClient)..fetchHomeData(),
        ),
        BlocProvider<LiveCubit>(
          create: (BuildContext context) =>
              LiveCubit(apiClient)..fetchLiveFixtures(),
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
      child: MaterialApp.router(
        routerConfig: RouterApp.router,
        title: AppText.appName,
        theme: AppTheme.darTheme(context),
        builder: EasyLoading.init(),
      ),
    );
  }
}
