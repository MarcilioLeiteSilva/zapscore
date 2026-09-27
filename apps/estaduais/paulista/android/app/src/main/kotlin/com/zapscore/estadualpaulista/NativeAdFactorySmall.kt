package com.zapscore.estadualpaulista

import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdView
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class NativeAdFactorySmall(private val layoutInflater: LayoutInflater) : GoogleMobileAdsPlugin.NativeAdFactory {
    override fun createNativeAd(
        nativeAd: NativeAd,
        customOptions: MutableMap<String, Any>?
    ): NativeAdView {
        val nativeAdView = layoutInflater.inflate(R.layout.custom_native_ad, null) as NativeAdView

        // Headline (Required)
        val headlineView = nativeAdView.findViewById<TextView>(R.id.ad_headline)
        headlineView.text = nativeAd.headline
        nativeAdView.headlineView = headlineView

        // Body
        val bodyView = nativeAdView.findViewById<TextView>(R.id.ad_body)
        if (nativeAd.body != null) {
            bodyView.text = nativeAd.body
            bodyView.visibility = View.VISIBLE
            nativeAdView.bodyView = bodyView
        } else {
            bodyView.visibility = View.GONE
            nativeAdView.bodyView = null
        }

        // Call to Action Button
        val ctaView = nativeAdView.findViewById<Button>(R.id.ad_call_to_action)
        if (nativeAd.callToAction != null) {
            ctaView.text = nativeAd.callToAction
            ctaView.visibility = View.VISIBLE
            nativeAdView.callToActionView = ctaView
        } else {
            ctaView.visibility = View.GONE
            nativeAdView.callToActionView = null
        }

        // Advertiser / Price
        val advertiserView = nativeAdView.findViewById<TextView>(R.id.ad_advertiser)
        val advertiserText = nativeAd.advertiser ?: nativeAd.store
        if (advertiserText != null) {
            advertiserView.text = advertiserText
            advertiserView.visibility = View.VISIBLE
            nativeAdView.advertiserView = advertiserView
        } else {
            advertiserView.visibility = View.GONE
            nativeAdView.advertiserView = null
        }

        // Icon / Image (Small layout uses iconView to comply with AdMob 120x120 MediaView policy)
        val iconView = nativeAdView.findViewById<ImageView>(R.id.ad_app_icon)
        val iconDrawable = nativeAd.icon?.drawable
            ?: nativeAd.mediaContent?.mainImage
            ?: nativeAd.images.firstOrNull()?.drawable

        if (iconDrawable != null) {
            iconView.setImageDrawable(iconDrawable)
            iconView.visibility = View.VISIBLE
            nativeAdView.iconView = iconView
        } else {
            iconView.visibility = View.GONE
            nativeAdView.iconView = null
        }
        nativeAdView.mediaView = null

        nativeAdView.setNativeAd(nativeAd)
        return nativeAdView
    }
}
