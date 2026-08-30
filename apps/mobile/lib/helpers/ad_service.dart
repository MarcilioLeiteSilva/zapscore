import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  // 🔹 IDs oficiais de Teste do Google AdMob vs IDs de Produção
  static String get bannerAdUnitId {
    if (kDebugMode) {
      // ID de teste oficial do Google AdMob para Banner (Android/iOS)
      return Platform.isIOS
          ? 'ca-app-pub-3940256099942544/2934735716'
          : 'ca-app-pub-3940256099942544/6300978111';
    }
    // ID de Produção
    return 'ca-app-pub-6887857057070736/4013175503';
  }

  static String get interstitialAdUnitId {
    if (kDebugMode) {
      // ID de teste oficial do Google AdMob para Interstitial (Android/iOS)
      return Platform.isIOS
          ? 'ca-app-pub-3940256099942544/4411468910'
          : 'ca-app-pub-3940256099942544/1033173712';
    }
    // ID de Produção
    return 'ca-app-pub-6887857057070736/1942583346';
  }

  static String get rewardedAdUnitId {
    if (kDebugMode) {
      // ID de teste oficial do Google AdMob para Rewarded (Android/iOS)
      return Platform.isIOS
          ? 'ca-app-pub-3940256099942544/1712485313'
          : 'ca-app-pub-3940256099942544/5224354917';
    }
    // ID de Produção
    return 'ca-app-pub-6887857057070736/1666213763';
  }

  // 🔹 Variáveis para Pré-carregamento e Controle Inteligente de Frequência
  static InterstitialAd? _preloadedInterstitial;
  static bool _isLoadingInterstitial = false;
  static DateTime? _lastInterstitialShownAt;
  static int _matchClickCounter = 0;

  // Intervalo mínimo entre quaisquer anúncios intersticiais em tela cheia (em segundos)
  static const int _minIntervalSeconds = 60;

  /// Inicializa com o fluxo oficial de Consentimento do Google UMP (LGPD / GDPR)
  static Future<void> init() async {
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
  static void showPrivacyOptionsForm(BuildContext context) {
    try {
      ConsentForm.showPrivacyOptionsForm((FormError? formError) {
        if (formError != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Opções de privacidade não disponíveis para esta região ou dispositivo.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Não foi possível abrir o formulário de privacidade: $e'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
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
          _preloadedInterstitial = null;
          _isLoadingInterstitial = false;
        },
      ),
    );
  }

  /// Exibe o Interstitial com controle de frequência / cooldown
  static void showInterstitialAd(VoidCallback onAdClosed, {bool isMatch = false}) {
    // 1. Se for clique em partida, exibir a cada 3 acessos para preservar a experiência
    if (isMatch) {
      _matchClickCounter++;
      if (_matchClickCounter % 3 != 0) {
        onAdClosed();
        preloadInterstitial();
        return;
      }
    }

    // 2. Verificar Cooldown (evitar excesso de anúncios seguidos)
    final now = DateTime.now();
    if (_lastInterstitialShownAt != null) {
      final elapsed = now.difference(_lastInterstitialShownAt!).inSeconds;
      if (elapsed < _minIntervalSeconds) {
        onAdClosed();
        preloadInterstitial();
        return;
      }
    }

    // 3. Se houver interstitial pré-carregado, exibir imediatamente
    if (_preloadedInterstitial != null) {
      _preloadedInterstitial!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          _preloadedInterstitial = null;
          _lastInterstitialShownAt = DateTime.now();
          preloadInterstitial();
          onAdClosed();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          ad.dispose();
          _preloadedInterstitial = null;
          preloadInterstitial();
          onAdClosed();
        },
      );
      _preloadedInterstitial!.show();
      return;
    }

    // 4. Se não estiver pronto, executa a ação e tenta carregar para a próxima vez
    preloadInterstitial();
    onAdClosed();
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
