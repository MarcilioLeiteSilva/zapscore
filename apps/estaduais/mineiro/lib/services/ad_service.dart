import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  static final AdService instance = AdService._internal();
  AdService._internal();

  /// Ad Unit IDs (Test in Debug, Real in Release)
  static String get bannerAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/6300978111'
          : 'ca-app-pub-3940256099942544/2934735716';
    }
    return 'ca-app-pub-6887857057070736/2639109305';
  }

  static String get interstitialAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/1033173712'
          : 'ca-app-pub-3940256099942544/4411468910';
    }
    return 'ca-app-pub-6887857057070736/6195210931';
  }

  static String get nativeAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/2247696110'
          : 'ca-app-pub-3940256099942544/3986624511';
    }
    return 'ca-app-pub-6887857057070736/9337264077';
  }

  static String get rewardedAdUnitId {
    if (kDebugMode) {
      return Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/5224354917'
          : 'ca-app-pub-3940256099942544/1712485313';
    }
    return 'ca-app-pub-6887857057070736/1666213763';
  }

  // Controle Inteligente de Frequência
  static InterstitialAd? _preloadedInterstitial;
  static bool _isLoadingInterstitial = false;
  static DateTime? _lastInterstitialShownAt;
  static int _matchClickCounter = 0;
  static const int _minIntervalSeconds = 15;

  /// Inicializa com o fluxo oficial de Consentimento do Google UMP (LGPD / GDPR)
  Future<void> init() async {
    try {
      final params = ConsentRequestParameters();
      ConsentInformation.instance.requestConsentInfoUpdate(
        params,
        () async {
          ConsentForm.loadAndShowConsentFormIfRequired((FormError? formError) async {
            if (formError != null) {
              debugPrint('⚠️ [AdService] Consent Form Error: ${formError.message}');
            }
            final canRequestAds = await ConsentInformation.instance.canRequestAds();
            if (canRequestAds) {
              await MobileAds.instance.initialize();
              if (kDebugMode) {
                await MobileAds.instance.updateRequestConfiguration(
                  RequestConfiguration(testDeviceIds: ['009A55C88C73C446B985FB6F333F961B']),
                );
              }
              preloadInterstitial();
            }
          });
        },
        (FormError error) async {
          debugPrint('⚠️ [AdService] Consent Info Update Error: ${error.message}');
          await MobileAds.instance.initialize();
          if (kDebugMode) {
            await MobileAds.instance.updateRequestConfiguration(
              RequestConfiguration(testDeviceIds: ['009A55C88C73C446B985FB6F333F961B']),
            );
          }
          preloadInterstitial();
        },
      );
    } catch (e) {
      debugPrint('⚠️ [AdService] Erro ao inicializar UMP Consent: $e');
      await MobileAds.instance.initialize();
      if (kDebugMode) {
        await MobileAds.instance.updateRequestConfiguration(
          RequestConfiguration(testDeviceIds: ['009A55C88C73C446B985FB6F333F961B']),
        );
      }
      preloadInterstitial();
    }
  }

  /// Permite ao usuário alterar ou revogar suas preferências de privacidade UMP (LGPD / GDPR)
  static Future<void> showPrivacyOptionsForm(BuildContext context) async {
    try {
      final status = await ConsentInformation.instance.getPrivacyOptionsRequirementStatus();
      if (!context.mounted) return;
      if (status == PrivacyOptionsRequirementStatus.required) {
        ConsentForm.showPrivacyOptionsForm((FormError? formError) {
          if (formError != null && context.mounted) {
            _showPrivacyDialog(context);
          }
        });
      } else {
        _showPrivacyDialog(context);
      }
    } catch (_) {
      if (context.mounted) {
        _showPrivacyDialog(context);
      }
    }
  }

  static void _showPrivacyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.privacy_tip_outlined, color: Colors.amber),
            SizedBox(width: 8),
            Text('Privacidade de Anúncios', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Suas preferências de privacidade e personalização de anúncios seguem as diretrizes da LGPD e as configurações globais da sua conta Google no dispositivo.',
          style: TextStyle(fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Entendido', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  /// Pré-carrega o próximo interstitial para exibição instantânea
  static void preloadInterstitial() {
    if (_preloadedInterstitial != null || _isLoadingInterstitial) return;

    _isLoadingInterstitial = true;
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _preloadedInterstitial = ad;
          _isLoadingInterstitial = false;
        },
        onAdFailedToLoad: (error) {
          debugPrint('⚠️ InterstitialAd failed to load: $error');
          _preloadedInterstitial = null;
          _isLoadingInterstitial = false;
        },
      ),
    );
  }

  void loadInterstitialAd() => preloadInterstitial();

  /// Exibe o Interstitial com controle inteligente de frequência / cooldown
  void showInterstitialAd({VoidCallback? onAdClosed, bool isMatch = false}) {
    // 1. Se for clique em partida, exibir a cada 3 acessos
    if (isMatch) {
      _matchClickCounter++;
      if (_matchClickCounter % 3 != 0) {
        if (onAdClosed != null) onAdClosed();
        preloadInterstitial();
        return;
      }
    }

    // 2. Verificar Cooldown mínimo de 60 segundos
    final now = DateTime.now();
    if (_lastInterstitialShownAt != null) {
      final elapsed = now.difference(_lastInterstitialShownAt!).inSeconds;
      if (elapsed < _minIntervalSeconds) {
        if (onAdClosed != null) onAdClosed();
        preloadInterstitial();
        return;
      }
    }

    // 3. Se houver interstitial pré-carregado, exibir
    if (_preloadedInterstitial != null) {
      _preloadedInterstitial!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          _preloadedInterstitial = null;
          _lastInterstitialShownAt = DateTime.now();
          preloadInterstitial();
          if (onAdClosed != null) onAdClosed();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          ad.dispose();
          _preloadedInterstitial = null;
          preloadInterstitial();
          if (onAdClosed != null) onAdClosed();
        },
      );
      _preloadedInterstitial!.show();
      return;
    }

    // 4. Se não estiver carregado, prossegue imediatamente
    preloadInterstitial();
    if (onAdClosed != null) onAdClosed();
  }

  /// Exibe Anúncio Recompensado (Rewarded Ad)
  static void showRewardedAd({
    required VoidCallback onRewardEarned,
    VoidCallback? onAdClosed,
  }) {
    RewardedAd.load(
      adUnitId: rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          ad.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              if (onAdClosed != null) onAdClosed();
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              if (onAdClosed != null) onAdClosed();
            },
          );
          ad.show(onUserEarnedReward: (adWithoutView, reward) {
            onRewardEarned();
          });
        },
        onAdFailedToLoad: (error) {
          if (onAdClosed != null) onAdClosed();
        },
      ),
    );
  }
}
