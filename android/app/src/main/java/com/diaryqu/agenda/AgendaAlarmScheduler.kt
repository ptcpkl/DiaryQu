package com.diaryqu.agenda

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject
import com.diaryqu.MainActivity

internal data class SavedAgendaAlarm(
  val id: String,
  val title: String,
  val body: String,
  val triggerAtMillis: Long,
)

internal object AgendaAlarmScheduler {
  const val ACTION_FIRE = "com.diaryqu.agenda.FIRE"
  const val ACTION_SNOOZE = "com.diaryqu.agenda.SNOOZE"
  const val ACTION_DISMISS = "com.diaryqu.agenda.DISMISS"

  private const val PREFS = "diaryqu_agenda_reminders"
  private const val CHANNEL_ID = "diaryqu_agenda"
  private const val CHANNEL_NAME = "Reminder Agenda"
  private const val SNOOZE_MILLIS = 5 * 60 * 1000L

  fun canScheduleExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val manager = context.getSystemService(AlarmManager::class.java)
    return manager.canScheduleExactAlarms()
  }

  fun schedule(
    context: Context,
    id: String,
    title: String,
    body: String,
    triggerAtMillis: Long,
    persist: Boolean = true,
  ): Boolean {
    if (triggerAtMillis <= System.currentTimeMillis()) {
      cancel(context, id)
      return false
    }

    val manager = context.getSystemService(AlarmManager::class.java)
    val intent = firePendingIntent(context, id, title, body, triggerAtMillis)
    val exact = canScheduleExact(context)

    if (exact) {
      manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, intent)
    } else {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, intent)
    }

    if (persist) {
      save(context, SavedAgendaAlarm(id, title, body, triggerAtMillis))
    }
    return exact
  }

  fun cancel(context: Context, id: String) {
    val manager = context.getSystemService(AlarmManager::class.java)
    manager.cancel(
      PendingIntent.getBroadcast(
        context,
        requestCode(id),
        Intent(context, AgendaReminderReceiver::class.java).setAction(ACTION_FIRE),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      ),
    )
    removeSaved(context, id)
    context.getSystemService(NotificationManager::class.java).cancel(notificationId(id))
  }

  fun snooze(context: Context, alarm: SavedAgendaAlarm) {
    context.getSystemService(NotificationManager::class.java).cancel(notificationId(alarm.id))
    schedule(
      context,
      alarm.id,
      alarm.title,
      alarm.body,
      System.currentTimeMillis() + SNOOZE_MILLIS,
    )
  }

  fun showNotification(context: Context, alarm: SavedAgendaAlarm) {
    ensureChannel(context)
    val notificationManager = context.getSystemService(NotificationManager::class.java)

    val contentIntent = PendingIntent.getActivity(
      context,
      requestCode(alarm.id) xor 0x1100,
      Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      },
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val snoozeIntent = actionPendingIntent(context, ACTION_SNOOZE, alarm, 0x2200)
    val dismissIntent = actionPendingIntent(context, ACTION_DISMISS, alarm, 0x3300)

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }

    builder
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(alarm.title)
      .setContentText(alarm.body)
      .setStyle(Notification.BigTextStyle().bigText(alarm.body))
      .setCategory(Notification.CATEGORY_REMINDER)
      .setAutoCancel(true)
      .setContentIntent(contentIntent)
      .setWhen(System.currentTimeMillis())
      .setShowWhen(true)
      .addAction(0, "Tunda 5 menit", snoozeIntent)
      .addAction(0, "Selesai", dismissIntent)

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      @Suppress("DEPRECATION")
      builder.setPriority(Notification.PRIORITY_HIGH)
    }

    notificationManager.notify(notificationId(alarm.id), builder.build())
  }

  fun fromIntent(intent: Intent): SavedAgendaAlarm? {
    val id = intent.getStringExtra("agenda_id") ?: return null
    val title = intent.getStringExtra("agenda_title") ?: "Agenda DiaryQu"
    val body = intent.getStringExtra("agenda_body") ?: "Waktunya agenda Anda."
    val trigger = intent.getLongExtra("agenda_trigger", System.currentTimeMillis())
    return SavedAgendaAlarm(id, title, body, trigger)
  }

  fun removeSaved(context: Context, id: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(id).apply()
  }

  fun rescheduleAll(context: Context) {
    val now = System.currentTimeMillis()
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    preferences.all.forEach { (id, value) ->
      val alarm = decode(id, value as? String) ?: return@forEach
      if (alarm.triggerAtMillis > now) {
        schedule(context, alarm.id, alarm.title, alarm.body, alarm.triggerAtMillis, persist = false)
      } else {
        preferences.edit().remove(id).apply()
      }
    }
  }

  private fun firePendingIntent(
    context: Context,
    id: String,
    title: String,
    body: String,
    triggerAtMillis: Long,
  ): PendingIntent {
    val intent = Intent(context, AgendaReminderReceiver::class.java).apply {
      action = ACTION_FIRE
      putExtra("agenda_id", id)
      putExtra("agenda_title", title)
      putExtra("agenda_body", body)
      putExtra("agenda_trigger", triggerAtMillis)
    }
    return PendingIntent.getBroadcast(
      context,
      requestCode(id),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun actionPendingIntent(
    context: Context,
    action: String,
    alarm: SavedAgendaAlarm,
    salt: Int,
  ): PendingIntent {
    val intent = Intent(context, AgendaReminderReceiver::class.java).apply {
      this.action = action
      putExtra("agenda_id", alarm.id)
      putExtra("agenda_title", alarm.title)
      putExtra("agenda_body", alarm.body)
      putExtra("agenda_trigger", alarm.triggerAtMillis)
    }
    return PendingIntent.getBroadcast(
      context,
      requestCode(alarm.id) xor salt,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun save(context: Context, alarm: SavedAgendaAlarm) {
    val json = JSONObject()
      .put("title", alarm.title)
      .put("body", alarm.body)
      .put("trigger", alarm.triggerAtMillis)
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(alarm.id, json.toString())
      .apply()
  }

  private fun decode(id: String, raw: String?): SavedAgendaAlarm? {
    if (raw == null) return null
    return try {
      val json = JSONObject(raw)
      SavedAgendaAlarm(
        id = id,
        title = json.optString("title", "Agenda DiaryQu"),
        body = json.optString("body", "Waktunya agenda Anda."),
        triggerAtMillis = json.getLong("trigger"),
      )
    } catch (_: Exception) {
      null
    }
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_HIGH,
    ).apply {
      description = "Pengingat agenda dan jadwal DiaryQu"
      enableVibration(true)
    }
    manager.createNotificationChannel(channel)
  }

  private fun requestCode(id: String): Int = id.hashCode() and 0x7fffffff
  private fun notificationId(id: String): Int = (id.hashCode() xor 0x5A5A5A5A) and 0x7fffffff
}
