package com.diaryqu.ads

import android.content.Context
import android.view.Gravity
import android.widget.FrameLayout
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView

private class DiaryQuBannerContainer(context: Context) : FrameLayout(context) {
  private var adView: AdView? = null

  init {
    minimumHeight = dp(50)
  }

  fun load(adUnitId: String?) {
    clearAd()
    if (!DiaryQuAds.isEnabled() || adUnitId.isNullOrBlank()) return

    val banner =
      AdView(context).apply {
        setAdSize(AdSize.BANNER)
        this.adUnitId = adUnitId
      }

    val params = LayoutParams(dp(320), dp(50), Gravity.CENTER)
    addView(banner, params)
    adView = banner
    banner.loadAd(DiaryQuAds.buildBannerRequest())
  }

  fun destroy() {
    clearAd()
  }

  private fun clearAd() {
    adView?.destroy()
    adView = null
    removeAllViews()
  }

  private fun dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()
}

class DiaryQuBannerAdViewManager : SimpleViewManager<DiaryQuBannerContainer>() {
  override fun getName(): String = "DiaryQuBannerAdView"

  override fun createViewInstance(reactContext: ThemedReactContext): DiaryQuBannerContainer =
    DiaryQuBannerContainer(reactContext)

  @ReactProp(name = "adUnitId")
  fun setAdUnitId(view: DiaryQuBannerContainer, adUnitId: String?) {
    view.load(adUnitId)
  }

  override fun onDropViewInstance(view: DiaryQuBannerContainer) {
    view.destroy()
    super.onDropViewInstance(view)
  }
}
