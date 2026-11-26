package com.zapscore.estadualacreano

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "acreanoNativeAdFactory",
            NativeAdFactorySmall(layoutInflater)
        )
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "acreanoNativeAdFactoryMedium",
            NativeAdFactoryMedium(layoutInflater)
        )
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "acreanoNativeAdFactory")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "acreanoNativeAdFactoryMedium")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
