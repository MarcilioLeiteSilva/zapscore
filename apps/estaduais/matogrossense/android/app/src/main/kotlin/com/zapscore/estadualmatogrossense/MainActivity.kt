package com.zapscore.estadualmatogrossense

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "matogrossenseNativeAdFactory",
            NativeAdFactorySmall(layoutInflater)
        )
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "matogrossenseNativeAdFactoryMedium",
            NativeAdFactoryMedium(layoutInflater)
        )
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "matogrossenseNativeAdFactory")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "matogrossenseNativeAdFactoryMedium")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
