import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../services/ad_service.dart';
import '../../helpers/helpers.dart';

enum NativeAdVariant {
  newsOrVideo,
  fixture,
  aiAnalysis,
}

class AppNativeAdWidget extends StatefulWidget {
  const AppNativeAdWidget({
    super.key,
    this.variant = NativeAdVariant.newsOrVideo,
    this.margin,
  });

  final NativeAdVariant variant;
  final EdgeInsetsGeometry? margin;

  @override
  State<AppNativeAdWidget> createState() => _AppNativeAdWidgetState();
}

class _AppNativeAdWidgetState extends State<AppNativeAdWidget> with AutomaticKeepAliveClientMixin {
  NativeAd? _nativeAd;
  bool _isAdLoaded = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadNativeAd();
  }

  void _loadNativeAd() {
    _nativeAd = NativeAd(
      adUnitId: AdService.nativeAdUnitId,
      factoryId: 'cariocaNativeAdFactory',
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (ad) {
          if (mounted) {
            setState(() {
              _isAdLoaded = true;
            });
          }
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('⚠️ [AppNativeAdWidget] Failed to load native ad: $error');
          ad.dispose();
          if (mounted) {
            setState(() {
              _isAdLoaded = false;
              _nativeAd = null;
            });
          }
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _nativeAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (!_isAdLoaded || _nativeAd == null) {
      return const SizedBox.shrink();
    }

    final double radius = widget.variant == NativeAdVariant.fixture ? 15.0 : 10.0;

    return Container(
      margin: widget.margin ?? EdgeInsets.zero,
      width: double.infinity,
      height: 90,
      decoration: BoxDecoration(
        color: AppColor.card,
        borderRadius: BorderRadius.circular(radius),
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: AdWidget(ad: _nativeAd!),
    );
  }
}
