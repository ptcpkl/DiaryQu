import {
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import type {AgendaEntry} from '../types';

type ScheduleResult = {scheduled: boolean; exact: boolean};

type AgendaReminderNativeModule = {
  scheduleReminder(
    id: string,
    title: string,
    body: string,
    triggerAtMillis: number,
  ): Promise<ScheduleResult>;
  cancelReminder(id: string): Promise<boolean>;
  canScheduleExactAlarms(): Promise<boolean>;
  openExactAlarmSettings(): Promise<boolean>;
};

const nativeModule = NativeModules.AgendaReminder as
  | AgendaReminderNativeModule
  | undefined;

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Number(Platform.Version) < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const existing = await PermissionsAndroid.check(permission);
  if (existing) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Izinkan reminder Agenda',
    message:
      'DiaryQu memerlukan izin notifikasi agar agenda dapat mengingatkan Anda pada waktunya.',
    buttonPositive: 'Izinkan',
    buttonNegative: 'Nanti',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function reminderBody(entry: AgendaEntry): string {
  const details = [entry.location, entry.notes].filter(Boolean);
  return details.length > 0 ? details.join(' • ') : 'Agenda DiaryQu';
}

export const agendaReminderService = {
  async schedule(entry: AgendaEntry): Promise<ScheduleResult> {
    if (
      Platform.OS !== 'android' ||
      !nativeModule ||
      !entry.reminderEnabled ||
      !entry.reminderAt ||
      entry.status === 'completed'
    ) {
      return {scheduled: false, exact: false};
    }

    const triggerAtMillis = new Date(entry.reminderAt).getTime();
    if (!Number.isFinite(triggerAtMillis) || triggerAtMillis <= Date.now()) {
      await nativeModule.cancelReminder(entry.id);
      return {scheduled: false, exact: false};
    }

    const allowed = await ensureNotificationPermission();
    if (!allowed) {
      return {scheduled: false, exact: false};
    }

    return nativeModule.scheduleReminder(
      entry.id,
      entry.title,
      reminderBody(entry),
      triggerAtMillis,
    );
  },

  async cancel(id: string): Promise<void> {
    if (Platform.OS === 'android' && nativeModule) {
      await nativeModule.cancelReminder(id);
    }
  },

  async canScheduleExact(): Promise<boolean> {
    if (Platform.OS !== 'android' || !nativeModule) {
      return false;
    }
    return nativeModule.canScheduleExactAlarms();
  },

  async openExactAlarmSettings(): Promise<boolean> {
    if (Platform.OS !== 'android' || !nativeModule) {
      return false;
    }
    return nativeModule.openExactAlarmSettings();
  },
};
