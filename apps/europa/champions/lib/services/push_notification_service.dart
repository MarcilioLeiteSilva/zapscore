import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../helpers/helpers.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase init background error: $e');
  }
}

class PushNotificationService {
  static const String pbUrl = AppConfig.pocketbaseBaseUrl;
  static const String appSlug = AppConfig.appSlug;

  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'champions_league_live_channel',
    'Alertas UEFA Champions League',
    description: 'Notificações ao vivo de gols, início e fim de partidas do UEFA Champions League.',
    importance: Importance.max,
  );

  /// Obtém ou gera um ID único e persistente para este dispositivo
  static Future<String> _getOrCreateDeviceId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String? deviceId = prefs.getString('zapscore_device_unique_id');
      if (deviceId == null || deviceId.isEmpty) {
        deviceId = 'dev_${DateTime.now().millisecondsSinceEpoch}_${(1000 + (DateTime.now().microsecond % 9000))}';
        await prefs.setString('zapscore_device_unique_id', deviceId);
      }
      return deviceId;
    } catch (_) {
      return 'dev_${Platform.operatingSystem}_${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Setup Local Notifications
      const AndroidInitializationSettings androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const InitializationSettings initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(initSettings);

      // Create Android Channel
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // Request FCM permissions
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      // Handle Foreground Messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final notification = message.notification;
        final android = message.notification?.android;

        if (notification != null) {
          _localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                icon: android?.smallIcon ?? '@mipmap/ic_launcher',
                importance: Importance.max,
                priority: Priority.high,
              ),
              iOS: const DarwinNotificationDetails(
                presentAlert: true,
                presentBadge: true,
                presentSound: true,
              ),
            ),
          );
        }
      });

      // Escuta renovação de token do Google
      FirebaseMessaging.instance.onTokenRefresh.listen((String newToken) {
        debugPrint('FCM Token refreshed by Google: $newToken');
        unawaited(syncDeviceWithPocketBase());
      });

      // Sincroniza presença e token do aparelho no PocketBase na inicialização
      unawaited(syncDeviceWithPocketBase());
    } catch (e) {
      debugPrint('PushNotificationService initialization error: $e');
    }
  }

  static bool _isSyncing = false;

  /// Sincroniza o Token FCM e presença do dispositivo no PocketBase Europa
  /// Garante que apenas 1 registro exista por aparelho (sem duplicação).
  static Future<void> syncDeviceWithPocketBase({
    List<int>? favoriteTeamIds,
    List<int>? favoriteFixtureIds,
    Map<String, dynamic>? userProfile,
    Map<String, bool>? notifSettings,
  }) async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final messaging = FirebaseMessaging.instance;
      final String? token = await messaging.getToken();

      if (token == null || token.isEmpty) {
        debugPrint('FCM Token is null, skipping PocketBase sync.');
        _isSyncing = false;
        return;
      }

      final String deviceId = await _getOrCreateDeviceId();
      final prefs = await SharedPreferences.getInstance();
      final savedName = prefs.getString('user_name');
      final savedNickname = prefs.getString('user_nickname');
      final savedFavsList = prefs.getStringList('fav_teams') ?? [];
      final defaultFavs = savedFavsList.map((e) => int.tryParse(e) ?? 0).where((e) => e > 0).toList();
      final savedFixtList = prefs.getStringList('fav_fixtures') ?? [];
      final defaultFixtFavs = savedFixtList.map((e) => int.tryParse(e) ?? 0).where((e) => e > 0).toList();
      final defaultNotifMatch = prefs.getBool('notif_match') ?? true;

      final payload = {
        'fcm_token': token,
        'app_slug': appSlug,
        'favorite_teams': favoriteTeamIds ?? defaultFavs,
        'favorite_fixtures': favoriteFixtureIds ?? defaultFixtFavs,
        'notify_goals': notifSettings?['match'] ?? defaultNotifMatch,
        'notify_start': notifSettings?['match'] ?? defaultNotifMatch,
        'notify_end': notifSettings?['match'] ?? defaultNotifMatch,
        'platform': Platform.isAndroid ? 'android' : 'ios',
        'user_name': userProfile?['name'] ?? savedName ?? 'Device_$deviceId',
        'user_email': userProfile?['email'] ?? deviceId,
        'user_nickname': userProfile?['nickname'] ?? savedNickname ?? deviceId,
        'device_id': deviceId,
      };

      // 1. Busca se este token já possui registro no banco para este app
      final queryUri = Uri.parse('$pbUrl/api/collections/subscriptions/records').replace(
        queryParameters: {
          'filter': "fcm_token = '$token' && app_slug = '$appSlug'",
        },
      );
      final queryRes = await http.get(queryUri);

      if (queryRes.statusCode == 200) {
        final body = jsonDecode(queryRes.body);
        final items = body['items'] as List?;

        if (items != null && items.isNotEmpty) {
          // Atualiza o registro existente
          final existingId = items.first['id'];
          final patchUri = Uri.parse('$pbUrl/api/collections/subscriptions/records/$existingId');
          await http.patch(
            patchUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          );
          debugPrint('PocketBase Estaduais: Aparelho atualizado com sucesso ($existingId)');

          // Remove eventuais registros duplicados adicionais
          if (items.length > 1) {
            for (int i = 1; i < items.length; i++) {
              final dupId = items[i]['id'];
              try {
                await http.delete(Uri.parse('$pbUrl/api/collections/subscriptions/records/$dupId'));
                debugPrint('PocketBase Estaduais: Registro duplicado removido ($dupId)');
              } catch (_) {}
            }
          }
          _isSyncing = false;
          return;
        }
      }

      // 2. Primeira instalação do aparelho: Cria o registro inicial único
      final postUri = Uri.parse('$pbUrl/api/collections/subscriptions/records');
      final createRes = await http.post(
        postUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      if (createRes.statusCode == 200 || createRes.statusCode == 201) {
        debugPrint('PocketBase Europa: Novo aparelho registrado com sucesso');
      } else {
        debugPrint('PocketBase Create Record Status: ${createRes.statusCode}');
      }
    } catch (e) {
      debugPrint('Error syncing with PocketBase: $e');
    } finally {
      _isSyncing = false;
    }
  }
}
