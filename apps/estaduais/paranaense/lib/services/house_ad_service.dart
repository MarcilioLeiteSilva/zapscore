import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../helpers/helpers.dart';

class HouseAdModel {
  final String id;
  final String title;
  final String advertiser;
  final String placement;
  final String imageUrl;
  final String destinationUrl;
  final int rotateIntervalSeconds;

  const HouseAdModel({
    required this.id,
    required this.title,
    required this.advertiser,
    required this.placement,
    required this.imageUrl,
    required this.destinationUrl,
    this.rotateIntervalSeconds = 0,
  });

  factory HouseAdModel.fromJson(Map<String, dynamic> json) {
    return HouseAdModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      advertiser: json['advertiser']?.toString() ?? '',
      placement: json['placement']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      destinationUrl: json['destinationUrl']?.toString() ?? '',
      rotateIntervalSeconds: json['rotateIntervalSeconds'] != null
          ? (int.tryParse(json['rotateIntervalSeconds'].toString()) ?? 0)
          : 0,
    );
  }
}

class HouseAdService {
  static final HouseAdService instance = HouseAdService._internal();
  HouseAdService._internal();

  /// Busca um anúncio próprio elegível na ZapScore API com timeout defensivo de 2.5s
  Future<HouseAdModel?> fetchAd({
    required String placement,
    int? leagueId,
  }) async {
    try {
      final uri = Uri.parse('${AppConfig.apiBaseUrl}/ads/serve').replace(
        queryParameters: {
          'app': AppConfig.appSlug,
          'placement': placement,
          if (leagueId != null) 'leagueId': leagueId.toString(),
        },
      );

      final response = await http.get(uri).timeout(const Duration(milliseconds: 2500));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['hasAd'] == true && data['ad'] != null) {
          return HouseAdModel.fromJson(data['ad']);
        }
      }

      // Fallback defensivo com slug curto (ex: carioca) para sincronização imediata
      if (AppConfig.appSlug.startsWith('campeonato_')) {
        final shortSlug = AppConfig.appSlug.replaceFirst('campeonato_', '');
        final fallbackUri = Uri.parse('${AppConfig.apiBaseUrl}/ads/serve').replace(
          queryParameters: {
            'app': shortSlug,
            'placement': placement,
            if (leagueId != null) 'leagueId': leagueId.toString(),
          },
        );
        final fbResponse = await http.get(fallbackUri).timeout(const Duration(milliseconds: 2000));
        if (fbResponse.statusCode == 200) {
          final fbData = jsonDecode(fbResponse.body);
          if (fbData['success'] == true && fbData['hasAd'] == true && fbData['ad'] != null) {
            return HouseAdModel.fromJson(fbData['ad']);
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ [HouseAdService] Falha silenciosa ao buscar anúncio: $e');
    }
    return null;
  }

  /// Registra a visualização (impressão) de forma atômica e assíncrona
  void trackImpression(String adId) {
    if (adId.isEmpty) return;
    try {
      final uri = Uri.parse('${AppConfig.apiBaseUrl}/ads/$adId/impression');
      http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'appSlug': AppConfig.appSlug}),
      ).timeout(const Duration(seconds: 3)).catchError((_) => http.Response('', 500));
    } catch (_) {}
  }

  /// Registra o clique e abre a URL do patrocinador externamente via navegador
  Future<void> trackClickAndLaunch(String adId, String destinationUrl) async {
    if (destinationUrl.isEmpty) return;
    try {
      final uri = Uri.parse('${AppConfig.apiBaseUrl}/ads/$adId/click');
      http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'appSlug': AppConfig.appSlug}),
      ).timeout(const Duration(seconds: 3)).catchError((_) => http.Response('', 500));

      final targetUri = Uri.parse(destinationUrl);
      if (await canLaunchUrl(targetUri)) {
        await launchUrl(targetUri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('⚠️ [HouseAdService] Erro ao abrir URL de anúncio: $e');
    }
  }
}
