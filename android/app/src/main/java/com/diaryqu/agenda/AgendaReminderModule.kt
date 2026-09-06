package com.diaryqu.agenda

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AgendaReminderModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AgendaReminder"

  @ReactMethod
  fun scheduleReminder(
    id: String,
    title: String,
    body: String,
    triggerAtMillis: Double,
    promise: Promise,
  ) {
    try {
      val exact = AgendaAlarmScheduler.schedule(
        reactApplicationContext,
        id,
        title,
        body,
        triggerAtMillis.toLong(),
      )
      val result = Arguments.createMap().apply {
        putBoolean("scheduled", triggerAtMillis.toLong() > System.currentTimeMillis())
        putBoolean("exact", exact)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("AGENDA_REMINDER_SCHEDULE_FAILED", error)
    }
  }

  @ReactMethod
  fun cancelReminder(id: String, promise: Promise) {
    try {
      AgendaAlarmScheduler.cancel(reactApplicationContext, id)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("AGENDA_REMINDER_CANCEL_FAILED", error)
    }
  }

  @ReactMethod
  fun canScheduleExactAlarms(promise: Promise) {
    try {
      promise.resolve(AgendaAlarmScheduler.canScheduleExact(reactApplicationContext))
    } catch (error: Exception) {
      promise.reject("AGENDA_EXACT_ALARM_STATUS_FAILED", error)
    }
  }

  @ReactMethod
  fun openExactAlarmSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        promise.resolve(true)
        return
      }

      val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
        data = Uri.parse("package:${reactApplicationContext.packageName}")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      try {
        val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:${reactApplicationContext.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(fallback)
        promise.resolve(true)
      } catch (fallbackError: Exception) {
        promise.reject("AGENDA_EXACT_ALARM_SETTINGS_FAILED", fallbackError)
      }
    }
  }
}
