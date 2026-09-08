import {
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import type {NativeLocationPosition} from '../types';

type NativeFamilyLocationModule = {
  getCurrentPosition: () => Promise<{
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    provider?: string | null;
    timestamp?: number | null;
  }>;
};

const nativeModule = NativeModules.FamilyLocation as NativeFamilyLocationModule | undefined;

export async function requestForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  return (
    result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED ||
    result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
  );
}

export async function getForegroundPosition(): Promise<NativeLocationPosition> {
  if (Platform.OS !== 'android') {
    throw new Error('LOCATION_ANDROID_ONLY');
  }
  if (!nativeModule?.getCurrentPosition) {
    throw new Error('LOCATION_NATIVE_MODULE_UNAVAILABLE');
  }

  const position = await nativeModule.getCurrentPosition();
  const recordedAt = position.timestamp
    ? new Date(position.timestamp).toISOString()
    : new Date().toISOString();

  return {
    latitude: position.latitude,
    longitude: position.longitude,
    accuracyMeters:
      typeof position.accuracyMeters === 'number'
        ? position.accuracyMeters
        : null,
    provider: position.provider ?? null,
    recordedAt,
  };
}
