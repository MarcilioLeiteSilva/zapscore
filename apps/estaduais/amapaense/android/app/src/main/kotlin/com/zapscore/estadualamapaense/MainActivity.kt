package com.zapscore.estadualamapaense

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "amapaenseNativeAdFactory",
            NativeAdFactorySmall(layoutInflater)
        )
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "amapaenseNativeAdFactoryMedium",
            NativeAdFactoryMedium(layoutInflater)
        )
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "amapaenseNativeAdFactory")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "amapaenseNativeAdFactoryMedium")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
