package com.diaryqu.agenda

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AgendaReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val alarm = AgendaAlarmScheduler.fromIntent(intent) ?: return

    when (intent.action) {
      AgendaAlarmScheduler.ACTION_FIRE -> {
        AgendaAlarmScheduler.removeSaved(context, alarm.id)
        AgendaAlarmScheduler.showNotification(context, alarm)
      }
      AgendaAlarmScheduler.ACTION_SNOOZE -> {
        AgendaAlarmScheduler.snooze(context, alarm)
      }
      AgendaAlarmScheduler.ACTION_DISMISS -> {
        AgendaAlarmScheduler.cancel(context, alarm.id)
      }
    }
  }
}
