import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'house_ad_banner.dart';

export 'house_ad_banner.dart';

/// Widget de Banner com suporte híbrido: executa o Google AdMob com
/// fallback automático e instantâneo para House Ads (anúncios próprios da ZapScore).
class AdBannerWidget extends StatelessWidget {
  const AdBannerWidget({
    super.key,
    this.adSize,
    this.margin,
    this.preferHouseAdFirst = false,
  });

  final AdSize? adSize;
  final EdgeInsetsGeometry? margin;
  final bool preferHouseAdFirst;

  @override
  Widget build(BuildContext context) {
    return HouseAdBanner(
      adSize: adSize,
      margin: margin,
      preferHouseAdFirst: preferHouseAdFirst,
    );
  }
}
