import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

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
    'bundesliga_live_channel',
    'Alertas Bundesliga',
    description: 'Notificações ao vivo de gols, início e fim de partidas da Bundesliga.',
    importance: Importance.max,
  );

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
    } catch (e) {
      debugPrint('PushNotificationService initialization error: $e');
    }
  }

  /// Syncs FCM Token and user preferences with PocketBase Europa backend
  static Future<void> syncDeviceWithPocketBase({
    List<int>? favoriteTeamIds,
    Map<String, dynamic>? userProfile,
    Map<String, bool>? notifSettings,
  }) async {
    try {
      final messaging = FirebaseMessaging.instance;
      final String? token = await messaging.getToken();

      if (token == null || token.isEmpty) {
        debugPrint('FCM Token is null, skipping PocketBase sync.');
        return;
      }

      final payload = {
        'fcm_token': token,
        'app_slug': appSlug,
        'favorite_teams': favoriteTeamIds ?? [],
        'notify_goals': notifSettings?['match'] ?? true,
        'notify_start': notifSettings?['match'] ?? true,
        'notify_end': notifSettings?['match'] ?? true,
        'platform': Platform.isAndroid ? 'android' : 'ios',
        'user_name': userProfile?['name'] ?? '',
        'user_email': userProfile?['email'] ?? '',
        'user_nickname': userProfile?['nickname'] ?? '',
      };

      // Query existing record by fcm_token
      final filterUri = Uri.parse(
          '$pbUrl/api/collections/subscriptions/records?filter=(fcm_token="$token")');
      final queryRes = await http.get(filterUri);

      if (queryRes.statusCode == 200) {
        final body = jsonDecode(queryRes.body);
        final items = body['items'] as List?;

        if (items != null && items.isNotEmpty) {
          final existingId = items.first['id'];
          final patchUri = Uri.parse('$pbUrl/api/collections/subscriptions/records/$existingId');
          await http.patch(
            patchUri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          );
          debugPrint('PocketBase Europa Subscription Updated ($existingId)');
          return;
        }
      }

      // Create new record
      final postUri = Uri.parse('$pbUrl/api/collections/subscriptions/records');
      final createRes = await http.post(
        postUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      if (createRes.statusCode == 200 || createRes.statusCode == 201) {
        debugPrint('PocketBase Europa Subscription Created');
      } else {
        debugPrint('PocketBase Create Record Status: ${createRes.statusCode}');
      }
    } catch (e) {
      debugPrint('Error syncing with PocketBase: $e');
    }
  }
}
