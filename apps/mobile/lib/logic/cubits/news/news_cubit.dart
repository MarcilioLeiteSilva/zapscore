import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/news.dart';

abstract class NewsState {}
class NewsInitial extends NewsState {}
class NewsLoading extends NewsState {}
class NewsLoaded extends NewsState {
  final List<News> news;
  NewsLoaded(this.news);
}
class NewsError extends NewsState {
  final String message;
  NewsError(this.message);
}

class NewsCubit extends Cubit<NewsState> {
  final ApiClient apiClient;
  NewsCubit(this.apiClient) : super(NewsInitial());

  Future<void> fetchNews({String? leagueId, String? teamId}) async {
    emit(NewsLoading());
    try {
      final news = await apiClient.getNews(leagueId: leagueId, teamId: teamId);
      emit(NewsLoaded(news));
    } catch (e) {
      emit(NewsError(e.toString()));
    }
  }
}
