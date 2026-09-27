import 'dart:math';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/house_ad_service.dart';

/// Pop-up de Boas-Vindas (100% Livre de AdMob)
/// Dimensões recomendadas: 600 x 600 px (Aspect Ratio 1:1 Quadrado)
/// Regra de Frequência: Exibido no máximo 1x ao dia por torcedor via SharedPreferences.
/// Se não houver anúncio ativo ou se já visualizou hoje, não exibe nada (zero impacto visual).
class HousePopupLaunchHelper {
  static bool _hasCheckedInSession = false;

  static Future<void> checkAndShow(BuildContext context) async {
    if (_hasCheckedInSession) return;
    _hasCheckedInSession = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now();
      final todayKey = 'house_ad_popup_${now.year}_${now.month}_${now.day}';

      // 1. Verifica se já foi exibido hoje para este torcedor
      if (prefs.getBool(todayKey) == true) {
        return;
      }

      // 2. Consulta a API para verificar se há campanha ativa
      final ad = await HouseAdService.instance.fetchAd(placement: 'popup_launch');
      if (ad == null || ad.imageUrl.isEmpty) {
        return;
      }

      if (!context.mounted) return;

      // 3. Marca no dispositivo que foi exibido hoje
      await prefs.setBool(todayKey, true);

      if (!context.mounted) return;

      // 4. Registra a impressão no painel
      HouseAdService.instance.trackImpression(ad.id);

      // 5. Exibe o modal na tela
      await showDialog(
        context: context,
        barrierDismissible: true,
        barrierColor: const Color.fromRGBO(0, 0, 0, 0.75),
        builder: (dialogContext) {
          final screenWidth = MediaQuery.of(dialogContext).size.width;
          final double size = min(screenWidth * 0.85, 360.0);

          return Dialog(
            backgroundColor: Colors.transparent,
            elevation: 0,
            insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Botão de fechar (X) no topo direito
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 28),
                    onPressed: () => Navigator.of(dialogContext).pop(),
                  ),
                ),
                const SizedBox(height: 6),
                // Card 1:1 Quadrado (600x600 px)
                Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        Navigator.of(dialogContext).pop();
                        HouseAdService.instance.trackClickAndLaunch(
                          ad.id,
                          ad.destinationUrl,
                        );
                      },
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CachedNetworkImage(
                            imageUrl: ad.imageUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: Colors.black26,
                            ),
                            errorWidget: (context, url, error) => const SizedBox.shrink(),
                          ),
                          Positioned(
                            right: 8,
                            bottom: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color.fromRGBO(0, 0, 0, 0.7),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'Patrocinado',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    } catch (e) {
      debugPrint('⚠️ [HousePopupLaunchHelper] Falha silenciosa: $e');
    }
  }
}
