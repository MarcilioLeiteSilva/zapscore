package com.zapscore.estadualcarioca

import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import com.google.android.gms.ads.nativead.MediaView
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdView
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class NativeAdFactorySmall(private val layoutInflater: LayoutInflater) : GoogleMobileAdsPlugin.NativeAdFactory {
    override fun createNativeAd(
        nativeAd: NativeAd,
        customOptions: MutableMap<String, Any>?
    ): NativeAdView {
        val nativeAdView = layoutInflater.inflate(R.layout.custom_native_ad, null) as NativeAdView

        // Headline
        val headlineView = nativeAdView.findViewById<TextView>(R.id.ad_headline)
        headlineView.text = nativeAd.headline
        nativeAdView.headlineView = headlineView

        // Body
        val bodyView = nativeAdView.findViewById<TextView>(R.id.ad_body)
        if (nativeAd.body != null) {
            bodyView.text = nativeAd.body
            bodyView.visibility = View.VISIBLE
        } else {
            bodyView.visibility = View.GONE
        }
        nativeAdView.bodyView = bodyView

        // Call to Action Button
        val ctaView = nativeAdView.findViewById<Button>(R.id.ad_call_to_action)
        if (nativeAd.callToAction != null) {
            ctaView.text = nativeAd.callToAction
            ctaView.visibility = View.VISIBLE
        } else {
            ctaView.visibility = View.GONE
        }
        nativeAdView.callToActionView = ctaView

        // Advertiser / Price
        val advertiserView = nativeAdView.findViewById<TextView>(R.id.ad_advertiser)
        val advertiserText = nativeAd.advertiser ?: nativeAd.store
        if (advertiserText != null) {
            advertiserView.text = advertiserText
            advertiserView.visibility = View.VISIBLE
        } else {
            advertiserView.visibility = View.GONE
        }
        nativeAdView.advertiserView = advertiserView

        // Icon / Media
        val iconView = nativeAdView.findViewById<ImageView>(R.id.ad_app_icon)
        val mediaView = nativeAdView.findViewById<MediaView>(R.id.ad_media)

        if (nativeAd.mediaContent != null && nativeAd.mediaContent!!.hasVideoContent()) {
            mediaView.mediaContent = nativeAd.mediaContent
            mediaView.visibility = View.VISIBLE
            iconView.visibility = View.GONE
            nativeAdView.mediaView = mediaView
        } else if (nativeAd.icon != null && nativeAd.icon!!.drawable != null) {
            iconView.setImageDrawable(nativeAd.icon!!.drawable)
            iconView.visibility = View.VISIBLE
            mediaView.visibility = View.GONE
            nativeAdView.iconView = iconView
        } else if (nativeAd.images.isNotEmpty() && nativeAd.images[0].drawable != null) {
            iconView.setImageDrawable(nativeAd.images[0].drawable)
            iconView.visibility = View.VISIBLE
            mediaView.visibility = View.GONE
            nativeAdView.imageView = iconView
        } else {
            iconView.visibility = View.GONE
            mediaView.visibility = View.GONE
        }

        nativeAdView.setNativeAd(nativeAd)
        return nativeAdView
    }
}
