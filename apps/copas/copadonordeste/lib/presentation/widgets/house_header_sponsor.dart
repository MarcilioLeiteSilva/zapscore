import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../services/house_ad_service.dart';

/// Card Nobre no Topo da Tabela / Oferecimento (100% Livre de AdMob)
/// Dimensões recomendadas: 640 x 120 px (Aspect Ratio 16:3)
/// Se não houver anúncio ativo, colapsa para SizedBox.shrink() com zero impacto visual.
/// Suporta rotação automática quando `rotateIntervalSeconds` for configurado no AdminPanel.
class HouseHeaderSponsor extends StatefulWidget {
  const HouseHeaderSponsor({
    super.key,
    this.leagueId,
    this.margin,
  });

  final int? leagueId;
  final EdgeInsetsGeometry? margin;

  @override
  State<HouseHeaderSponsor> createState() => _HouseHeaderSponsorState();
}

class _HouseHeaderSponsorState extends State<HouseHeaderSponsor> {
  HouseAdModel? _ad;
  bool _hasChecked = false;
  Timer? _rotationTimer;

  @override
  void initState() {
    super.initState();
    _fetchSponsor();
  }

  Future<void> _fetchSponsor() async {
    final ad = await HouseAdService.instance.fetchAd(
      placement: 'header_sponsor',
      leagueId: widget.leagueId,
    );
    if (!mounted) return;

    final isNewAd = ad != null && (_ad == null || _ad!.id != ad.id);

    setState(() {
      _ad = ad;
      _hasChecked = true;
    });

    if (isNewAd) {
      HouseAdService.instance.trackImpression(ad.id);
    }

    _scheduleNextRotation(ad?.rotateIntervalSeconds ?? 0);
  }

  void _scheduleNextRotation(int seconds) {
    _rotationTimer?.cancel();
    if (seconds > 0) {
      _rotationTimer = Timer(Duration(seconds: seconds), () {
        if (mounted) {
          _fetchSponsor();
        }
      });
    }
  }

  @override
  void dispose() {
    _rotationTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasChecked || _ad == null || _ad!.imageUrl.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: widget.margin ?? const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: AspectRatio(
        aspectRatio: 640 / 120, // 16:3 (Dimensões do AdminPanel)
        child: Container(
          decoration: BoxDecoration(
            color: const Color.fromRGBO(20, 20, 20, 0.9),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.08)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                HouseAdService.instance.trackClickAndLaunch(
                  _ad!.id,
                  _ad!.destinationUrl,
                );
              },
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                child: Stack(
                  key: ValueKey<String>(_ad!.id),
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: _ad!.imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: Colors.black12,
                      ),
                      errorWidget: (context, url, error) => const SizedBox.shrink(),
                    ),
                    Positioned(
                      right: 6,
                      bottom: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
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
          ),
        ),
      ),
    );
  }
}
