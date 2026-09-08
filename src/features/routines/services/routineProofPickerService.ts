import {NativeModules, Platform} from 'react-native';

import type {PickedRoutineProof} from '../types';

type RoutineProofPickerNative = {
  pickImage: () => Promise<PickedRoutineProof>;
};

function nativePicker(): RoutineProofPickerNative {
  const module = NativeModules.RoutineProofPicker as RoutineProofPickerNative | undefined;
  if (!module?.pickImage) {
    throw new Error('ROUTINE_PROOF_PICKER_UNAVAILABLE');
  }
  return module;
}

export const routineProofPickerService = {
  async pickImage(): Promise<PickedRoutineProof> {
    if (Platform.OS !== 'android') {
      throw new Error('ROUTINE_PROOF_PICKER_ANDROID_ONLY');
    }
    return nativePicker().pickImage();
  },
};
