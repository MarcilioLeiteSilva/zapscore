import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../repository/api/api_client.dart';
import '../../models/video.dart';

abstract class VideoState {}
class VideoInitial extends VideoState {}
class VideoLoading extends VideoState {}
class VideoLoaded extends VideoState {
  final List<Video> videos;
  VideoLoaded(this.videos);
}
class VideoError extends VideoState {
  final String message;
  VideoError(this.message);
}

class VideoCubit extends Cubit<VideoState> {
  final ApiClient apiClient;
  VideoCubit(this.apiClient) : super(VideoInitial());

  Future<void> fetchVideos({String? leagueId, String? teamId, int limit = 100}) async {
    emit(VideoLoading());
    try {
      final videos = await apiClient.getVideos(leagueId: leagueId, teamId: teamId, limit: limit);
      emit(VideoLoaded(videos));
    } catch (e) {
      emit(VideoError(e.toString()));
    }
  }
}
