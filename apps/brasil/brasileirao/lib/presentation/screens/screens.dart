import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';
import 'package:intl/intl.dart';

import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:flutter_svg/flutter_svg.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import 'package:loading_animation_widget/loading_animation_widget.dart';
import '../../helpers/helpers.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:syncfusion_flutter_datepicker/datepicker.dart';

import '../../logic/cubits/setting/setting_cubit.dart';
import '../../logic/cubits/home/home_cubit.dart';
import '../../logic/cubits/live/live_cubit.dart';
import '../../logic/cubits/fixture/fixture_cubit.dart';
import '../../logic/cubits/league/league_cubit.dart';
import '../../logic/cubits/favorite/favorite_cubit.dart';
import '../../logic/cubits/search/search_cubit.dart';
import '../../logic/cubits/team/team_cubit.dart';
import '../../logic/cubits/news/news_cubit.dart';
import '../../logic/cubits/video/video_cubit.dart';
import '../../repository/api/api_client.dart';
import '../../repository/locale/user_repository.dart';
import '../../logic/models/home_competition.dart';
import '../../logic/models/league.dart';
import '../../logic/models/team.dart';
import '../../logic/models/fixture.dart';
import '../../logic/models/player.dart';
import '../../logic/models/video.dart';
import '../../logic/models/news.dart';
import '../../logic/models/standing.dart';
import '../../logic/models/scorer.dart';
import '../../logic/models/ai_performance_stats.dart';
import '../../logic/models/tactical_comment.dart';
import '../../logic/models/competition.dart';
import '../../logic/models/competition_phase.dart';
import '../../logic/models/tie.dart';
import '../widgets/widgets.dart';
import '../widgets/ad_banner.dart';
import '../widgets/native_ad.dart';
import '../widgets/standings_table.dart';
import '../widgets/competition_bracket.dart';
import '../../services/ad_service.dart';

part 'user/welcome.dart';
part 'user/login.dart';
part 'user/register.dart';
part 'user/profile.dart';

part 'user/follow.dart';
part 'user/follow/teams.dart';
part 'user/follow/notification.dart';
part 'user/follow/leagues.dart';
part 'user/rest_pass.dart';

part 'home/fixture.dart';
part 'home/favourite.dart';
part 'home/watch.dart';
part 'home/news.dart';
part 'home/home.dart';
part 'home/settings.dart';
part 'home/live.dart';
part 'home/search.dart';

part 'fixture/fixt_details.dart';
part 'fixture/info.dart';
part 'fixture/summary.dart';
part 'fixture/stats.dart';
part 'fixture/report.dart';
part 'fixture/lienups.dart';
part 'fixture/table.dart';
part 'fixture/h2h.dart';
part 'fixture/ai_analysis.dart';
part 'fixture/tactical_comments.dart';
part 'fixture/ai_performance.dart';
part 'fixture/top_scorers.dart';

part 'profile/league.dart';
part 'profile/team.dart';
part 'profile/player.dart';

part 'news/news_content.dart';
part 'news/watch_content.dart';

part 'settings/about_brasileirao.dart';
part 'settings/edit_info.dart';
part 'settings/general.dart';
part 'settings/notification.dart';
part 'settings/languages.dart';
part 'settings/theme.dart';
part 'settings/privacy_policy.dart';
part 'settings/lgpd.dart';
