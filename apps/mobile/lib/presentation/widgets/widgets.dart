import 'package:cached_network_image/cached_network_image.dart';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:like_button/like_button.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:pattern_formatter/date_formatter.dart';
import 'package:intl/intl.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:zapscore/helpers/helpers.dart';

import '../../logic/cubits/home/home_cubit.dart';

import '../../logic/cubits/setting/setting_cubit.dart';
import '../../logic/cubits/league/league_cubit.dart';
import '../../logic/cubits/favorite/favorite_cubit.dart';
import '../../logic/cubits/search/search_cubit.dart';
import '../../logic/cubits/live/live_cubit.dart';
import '../../logic/cubits/team/team_cubit.dart';
import '../../logic/cubits/news/news_cubit.dart';
import '../../logic/cubits/video/video_cubit.dart';
import '../../logic/models/home_competition.dart';
import '../../logic/models/fixture.dart';
import '../../logic/models/league.dart';
import '../../logic/models/team.dart';
import '../../logic/models/fixture_event.dart';
import '../../logic/models/scorer.dart';
import '../../logic/models/news.dart';
import '../../logic/models/video.dart';

part 'user.dart';
part 'home.dart';
part 'fixture.dart';
part 'search.dart';
part 'events.dart';
part 'lienups.dart';
part 'competetion.dart';
part 'news.dart';
part 'team.dart';
part 'account.dart';
