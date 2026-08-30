part of 'helpers.dart';

extension QueryBuilder on BuildContext {
  double get width => MediaQuery.sizeOf(this).width;
  double get height => MediaQuery.sizeOf(this).height;
  EdgeInsets get padding => MediaQuery.paddingOf(this);

  TextTheme get textTheme => Theme.of(this).textTheme;
}

abstract class Toast {
  static showLoading() async {
    _customize();
    await EasyLoading.show(
      status: 'loading...',
      maskType: EasyLoadingMaskType.custom,
      dismissOnTap: false,
    );
  }

  static dismiss() async {
    EasyLoading.dismiss(animation: true);
  }

  static _customize() async {
    EasyLoading.instance
      ..backgroundColor = AppColor.primary
      ..maskColor = AppColor.dialogBack
      ..displayDuration = const Duration(milliseconds: 2000)
      ..indicatorType = EasyLoadingIndicatorType.fadingCircle
      ..animationStyle = EasyLoadingAnimationStyle.opacity
      ..indicatorSize = 45.0
      ..radius = 10.0
      ..dismissOnTap = false;
  }
}

int toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

bool isLive(String? status) {
  if (status == null) return false;
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'LIVE '];
  return liveStatuses.contains(status.toUpperCase().trim());
}

String getShortStatus(
    String? statusShort, String? statusLong, BuildContext context, {DateTime? date}) {
  if (statusShort == null) return 'TBD';

  if (statusShort.toUpperCase().trim() == 'HT') {
    return 'status_halftime'.tr(context);
  }

  // Status Vivo (Live)
  if (isLive(statusShort)) return 'status_live'.tr(context);

  switch (statusShort.toUpperCase().trim()) {
    case 'FT':
    case 'AET':
      return 'status_finished'.tr(context);
    case 'PEN':
      return 'status_penalties'.tr(context);
    case 'INT':
    case 'ABD':
    case 'SUSP':
      return 'status_interrupted'.tr(context);
    case 'PST':
      return 'status_postponed'.tr(context);
    case 'NS':
      if (date != null) {
        return DateFormat('HH:mm').format(date.toLocal());
      }
      // Se for NS e tiver hora, exibe a hora. Se não, exibe 'Fut'
      return statusLong?.contains(':') == true
          ? statusLong!
          : 'status_future'.tr(context);
    default:
      return statusShort;
  }
}
String getStatTranslation(String type, BuildContext context) {
  final normalized = type.toLowerCase().trim();

  final Map<String, String> typeToKey = {
    'shots on goal': 'stat_shots_on_goal',
    'shots off goal': 'stat_shots_off_goal',
    'total shots': 'stat_total_shots',
    'blocked shots': 'stat_blocked_shots',
    'shots insidebox': 'stat_shots_insidebox',
    'shots outsidebox': 'stat_shots_outsidebox',
    'fouls': 'stat_fouls',
    'corner kicks': 'stat_corner_kicks',
    'offsides': 'stat_offsides',
    'ball possession': 'stat_ball_possession',
    'yellow cards': 'stat_yellow_cards',
    'red cards': 'stat_red_cards',
    'goalkeeper saves': 'stat_goalkeeper_saves',
    'total passes': 'stat_total_passes',
    'passes accurate': 'stat_passes_accurate',
    'passes %': 'stat_passes_percent',
    'expected_goals': 'stat_expected_goals',
  };

  final key = typeToKey[normalized];
  if (key != null) return key.tr(context);

  return type; // Retorna o original se não encontrar tradução
}

String proxyImage(String? url) {
  if (url == null || url.isEmpty) return '';
  if (url.contains('media.api-sports.io')) {
    final path = url.split('media.api-sports.io/').last;
    return 'https://wsrv.nl/?url=media.api-sports.io/$path';
  }
  return url;
}
