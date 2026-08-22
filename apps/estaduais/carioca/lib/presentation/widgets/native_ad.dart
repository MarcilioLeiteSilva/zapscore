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
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadNativeAd();
  }

  void _loadNativeAd() {
    if (_nativeAd != null) return;

    final double radius = widget.variant == NativeAdVariant.fixture ? 15.0 : 10.0;

    _nativeAd = NativeAd(
      adUnitId: AdService.nativeAdUnitId,
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
          debugPrint('⚠️ [AdMob] Native Ad failed to load: ${error.message}');
          ad.dispose();
          if (mounted) {
            setState(() {
              _isAdLoaded = false;
              _nativeAd = null;
            });
          }
        },
      ),
      nativeTemplateStyle: NativeTemplateStyle(
        templateType: TemplateType.small,
        mainBackgroundColor: AppColor.card,
        cornerRadius: radius,
        callToActionTextStyle: NativeTemplateTextStyle(
          textColor: Colors.white,
          backgroundColor: const Color(0xFF008855),
          style: NativeTemplateFontStyle.bold,
          size: 11.0,
        ),
        primaryTextStyle: NativeTemplateTextStyle(
          textColor: Colors.white,
          style: NativeTemplateFontStyle.bold,
          size: 13.0,
          backgroundColor: Colors.transparent,
        ),
        secondaryTextStyle: NativeTemplateTextStyle(
          textColor: Colors.white70,
          style: NativeTemplateFontStyle.normal,
          size: 11.0,
          backgroundColor: Colors.transparent,
        ),
        tertiaryTextStyle: NativeTemplateTextStyle(
          textColor: Colors.white60,
          style: NativeTemplateFontStyle.normal,
          size: 10.0,
          backgroundColor: Colors.transparent,
        ),
      ),
    );

    _nativeAd!.load();
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

    final double height = 95.0;
    final double radius = widget.variant == NativeAdVariant.fixture ? 15.0 : 10.0;
    final EdgeInsetsGeometry defaultMargin = widget.variant == NativeAdVariant.aiAnalysis
        ? const EdgeInsets.symmetric(horizontal: 16, vertical: 10)
        : EdgeInsets.zero;

    return Container(
      margin: widget.margin ?? defaultMargin,
      height: height,
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
