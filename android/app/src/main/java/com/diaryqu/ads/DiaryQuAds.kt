package com.diaryqu.ads

import android.content.Context
import android.os.Bundle
import com.diaryqu.BuildConfig
import com.google.ads.mediation.admob.AdMobAdapter
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

object DiaryQuAds {
  const val TEST_BANNER_UNIT_ID = "ca-app-pub-3940256099942544/9214589741"

  fun isTestMode(): Boolean = BuildConfig.DEBUG || BuildConfig.ADS_USING_SAMPLE_IDS

  fun isEnabled(): Boolean =
    BuildConfig.DEBUG || (BuildConfig.ADS_PRODUCTION_ENABLED && !BuildConfig.ADS_USING_SAMPLE_IDS)

  fun bannerUnitId(): String =
    if (BuildConfig.DEBUG) TEST_BANNER_UNIT_ID else BuildConfig.ADMOB_BANNER_UNIT_ID

  fun initialize(context: Context) {
    val requestConfiguration =
      RequestConfiguration.Builder()
        .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
        .build()
    MobileAds.setRequestConfiguration(requestConfiguration)

    if (isEnabled()) {
      MobileAds.initialize(context) {}
    }
  }

  fun buildBannerRequest(): AdRequest {
    val extras = Bundle().apply { putInt("npa", 1) }
    return AdRequest.Builder()
      .addNetworkExtrasBundle(AdMobAdapter::class.java, extras)
      .build()
  }
}

class DiaryQuAdsConfigModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "DiaryQuAdsConfig"

  override fun getConstants(): MutableMap<String, Any> =
    mutableMapOf(
      "enabled" to DiaryQuAds.isEnabled(),
      "testMode" to DiaryQuAds.isTestMode(),
      "bannerUnitId" to DiaryQuAds.bannerUnitId(),
      "nonPersonalizedOnly" to true,
      "maxContentRating" to "G",
    )
}
