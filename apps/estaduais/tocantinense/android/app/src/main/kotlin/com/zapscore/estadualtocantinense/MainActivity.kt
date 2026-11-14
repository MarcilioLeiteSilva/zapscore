package com.zapscore.estadualtocantinense

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "tocantinenseNativeAdFactory",
            NativeAdFactorySmall(layoutInflater)
        )
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "tocantinenseNativeAdFactoryMedium",
            NativeAdFactoryMedium(layoutInflater)
        )
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "tocantinenseNativeAdFactory")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "tocantinenseNativeAdFactoryMedium")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
