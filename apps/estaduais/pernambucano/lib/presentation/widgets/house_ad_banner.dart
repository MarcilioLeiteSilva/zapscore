import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../services/ad_service.dart';
import '../../services/house_ad_service.dart';

class HouseAdBanner extends StatefulWidget {
  const HouseAdBanner({
    super.key,
    this.adSize,
    this.margin,
    this.preferHouseAdFirst = false,
  });

  final AdSize? adSize;
  final EdgeInsetsGeometry? margin;
  final bool preferHouseAdFirst;

  @override
  State<HouseAdBanner> createState() => _HouseAdBannerState();
}

class _HouseAdBannerState extends State<HouseAdBanner> with AutomaticKeepAliveClientMixin {
  BannerAd? _bannerAd;
  bool _isAdMobLoaded = false;
  HouseAdModel? _houseAd;
  bool _isLoadingHouseAd = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.preferHouseAdFirst) {
      _loadHouseAdFirst();
    } else {
      _loadAdaptiveAdMob();
    }
  }

  /// Modo B (Padrão): Solicita AdMob primeiro, com fallback para House Ad
  Future<void> _loadAdaptiveAdMob() async {
    if (_bannerAd != null) return;

    AdSize size = widget.adSize ?? AdSize.banner;
    if (widget.adSize == null) {
      final width = MediaQuery.of(context).size.width.truncate();
      if (width <= 0) return;
      try {
        final adaptiveSize = await AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(width);
        if (adaptiveSize != null) {
          size = adaptiveSize;
        }
      } catch (e) {
        debugPrint('[AdBannerWidget] Erro ao obter adaptive banner size: $e');
      }
    }

    if (!mounted) return;

    _bannerAd = BannerAd(
      adUnitId: AdService.bannerAdUnitId,
      size: size,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          debugPrint('[AdBannerWidget] ✅ Banner carregado com sucesso');
          if (mounted) {
            setState(() {
              _isAdMobLoaded = true;
              _houseAd = null;
            });
          }
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('[AdBannerWidget] ❌ Falha ao carregar banner: ${error.message} (code: ${error.code})');
          ad.dispose();
          if (mounted) {
            setState(() {
              _isAdMobLoaded = false;
              _bannerAd = null;
            });
            // AdMob falhou ou sem inventário (no-fill) -> Chaveia instantaneamente para o House Ad
            _fetchHouseAdFallback();
          }
        },
      ),
    );
    _bannerAd!.load();
  }

  /// Modo A: Busca primeiro o House Ad e usa AdMob como fallback se não houver patrocínio
  Future<void> _loadHouseAdFirst() async {
    if (_isLoadingHouseAd) return;
    _isLoadingHouseAd = true;

    final ad = await HouseAdService.instance.fetchAd(placement: 'banner_bottom');
    if (!mounted) return;

    if (ad != null) {
      setState(() {
        _houseAd = ad;
        _isAdMobLoaded = false;
      });
      HouseAdService.instance.trackImpression(ad.id);
    } else {
      // Sem anúncio próprio ativo -> carrega o AdMob
      _loadAdaptiveAdMob();
    }
    _isLoadingHouseAd = false;
  }

  /// Busca o anúncio próprio da ZapScore API quando o AdMob falha
  Future<void> _fetchHouseAdFallback() async {
    if (_isLoadingHouseAd) return;
    _isLoadingHouseAd = true;

    final ad = await HouseAdService.instance.fetchAd(placement: 'banner_bottom');
    if (!mounted) return;

    if (ad != null) {
      setState(() {
        _houseAd = ad;
      });
      HouseAdService.instance.trackImpression(ad.id);
    }
    _isLoadingHouseAd = false;
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    // 1. Renderiza o AdMob se estiver carregado
    if (_isAdMobLoaded && _bannerAd != null) {
      return Container(
        margin: widget.margin ?? const EdgeInsets.symmetric(vertical: 8),
        width: _bannerAd!.size.width.toDouble(),
        height: _bannerAd!.size.height.toDouble(),
        alignment: Alignment.center,
        child: AdWidget(ad: _bannerAd!),
      );
    }

    // 2. Renderiza o House Ad se o AdMob falhou e houver patrocínio
    if (_houseAd != null && _houseAd!.imageUrl.isNotEmpty) {
      final double bannerWidth = widget.adSize?.width.toDouble() ?? MediaQuery.of(context).size.width - 32;
      final double bannerHeight = widget.adSize?.height.toDouble() ?? 56;

      return Container(
        margin: widget.margin ?? const EdgeInsets.symmetric(vertical: 8),
        width: bannerWidth,
        height: bannerHeight,
        alignment: Alignment.center,
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              HouseAdService.instance.trackClickAndLaunch(
                _houseAd!.id,
                _houseAd!.destinationUrl,
              );
            },
            child: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: _houseAd!.imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: Colors.black12,
                  ),
                  errorWidget: (context, url, error) => const SizedBox.shrink(),
                ),
                Positioned(
                  right: 4,
                  bottom: 3,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(0, 0, 0, 0.65),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Patrocinado',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 8,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // 3. Sem anúncios disponíveis em nenhuma das redes -> colapsa sem espaço vazio
    return const SizedBox.shrink();
  }
}
