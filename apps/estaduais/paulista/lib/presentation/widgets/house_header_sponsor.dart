import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../services/house_ad_service.dart';

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

    setState(() {
      _ad = ad;
      _hasChecked = true;
    });

    if (ad != null) {
      HouseAdService.instance.trackImpression(ad.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasChecked || _ad == null || _ad!.imageUrl.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: widget.margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 48,
      decoration: BoxDecoration(
        color: const Color.fromRGBO(0, 0, 0, 0.35),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color.fromRGBO(255, 255, 255, 0.08)),
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'OFERECIMENTO',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w800,
                        color: Colors.amber.shade400,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Text(
                      _ad!.advertiser.isNotEmpty ? _ad!.advertiser : _ad!.title,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                const Spacer(),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: CachedNetworkImage(
                    imageUrl: _ad!.imageUrl,
                    height: 36,
                    fit: BoxFit.contain,
                    placeholder: (context, url) => const SizedBox(width: 60),
                    errorWidget: (context, url, error) => const SizedBox.shrink(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
