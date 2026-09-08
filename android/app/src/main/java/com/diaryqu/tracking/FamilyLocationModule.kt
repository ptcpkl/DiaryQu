package com.diaryqu.tracking

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.atomic.AtomicBoolean

class FamilyLocationModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "FamilyLocation"

  private fun hasLocationPermission(): Boolean {
    val fine = ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.ACCESS_FINE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED
    val coarse = ContextCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.ACCESS_COARSE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED
    return fine || coarse
  }

  private fun resolveLocation(location: Location, promise: Promise) {
    val result = Arguments.createMap().apply {
      putDouble("latitude", location.latitude)
      putDouble("longitude", location.longitude)
      if (location.hasAccuracy()) {
        putDouble("accuracyMeters", location.accuracy.toDouble())
      } else {
        putNull("accuracyMeters")
      }
      putString("provider", location.provider)
      putDouble("timestamp", location.time.toDouble())
    }
    promise.resolve(result)
  }

  @Suppress("DEPRECATION")
  @ReactMethod
  fun getCurrentPosition(promise: Promise) {
    if (!hasLocationPermission()) {
      promise.reject("LOCATION_PERMISSION_REQUIRED", "Foreground location permission is required")
      return
    }

    val locationManager = reactContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    if (locationManager == null) {
      promise.reject("LOCATION_UNAVAILABLE", "Location service is unavailable")
      return
    }

    try {
      val enabledProviders = locationManager.getProviders(true)
      if (enabledProviders.isEmpty()) {
        promise.reject("LOCATION_UNAVAILABLE", "No enabled location provider")
        return
      }

      val lastKnown = enabledProviders
        .mapNotNull { provider ->
          runCatching { locationManager.getLastKnownLocation(provider) }.getOrNull()
        }
        .maxByOrNull { it.time }

      val now = System.currentTimeMillis()
      if (lastKnown != null && now - lastKnown.time <= 120_000L) {
        resolveLocation(lastKnown, promise)
        return
      }

      val provider = when {
        locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
        locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
        else -> enabledProviders.first()
      }

      val completed = AtomicBoolean(false)
      val handler = Handler(Looper.getMainLooper())
      val timeout = Runnable {
        if (completed.compareAndSet(false, true)) {
          if (lastKnown != null) {
            resolveLocation(lastKnown, promise)
          } else {
            promise.reject("LOCATION_TIMEOUT", "Timed out waiting for a foreground location")
          }
        }
      }
      handler.postDelayed(timeout, 12_000L)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        locationManager.getCurrentLocation(
          provider,
          null,
          reactContext.mainExecutor,
        ) { location ->
          if (completed.compareAndSet(false, true)) {
            handler.removeCallbacks(timeout)
            if (location != null) {
              resolveLocation(location, promise)
            } else if (lastKnown != null) {
              resolveLocation(lastKnown, promise)
            } else {
              promise.reject("LOCATION_UNAVAILABLE", "Current location is unavailable")
            }
          }
        }
      } else {
        val listener = object : LocationListener {
          override fun onLocationChanged(location: Location) {
            if (completed.compareAndSet(false, true)) {
              handler.removeCallbacks(timeout)
              locationManager.removeUpdates(this)
              resolveLocation(location, promise)
            }
          }

          override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
          override fun onProviderEnabled(provider: String) = Unit
          override fun onProviderDisabled(provider: String) = Unit
        }
        locationManager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
      }
    } catch (error: SecurityException) {
      promise.reject("LOCATION_PERMISSION_REQUIRED", error)
    } catch (error: Exception) {
      promise.reject("LOCATION_UNAVAILABLE", error)
    }
  }
}
