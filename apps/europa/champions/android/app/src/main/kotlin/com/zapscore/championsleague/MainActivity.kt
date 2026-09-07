package com.zapscore.championsleague

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "championsNativeAdFactory",
            NativeAdFactorySmall(layoutInflater)
        )
        GoogleMobileAdsPlugin.registerNativeAdFactory(
            flutterEngine,
            "championsNativeAdFactoryMedium",
            NativeAdFactoryMedium(layoutInflater)
        )
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "championsNativeAdFactory")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "championsNativeAdFactoryMedium")
        super.cleanUpFlutterEngine(flutterEngine)
    }
}
