import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

import {
  DIARYQU_SUPABASE_PUBLISHABLE_KEY,
  DIARYQU_SUPABASE_URL,
} from '../../config/supabase';

type RuntimeProcess = {
  env?: {
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_ANON_KEY?: string;
  };
};

type RuntimeGlobal = typeof globalThis & {
  process?: RuntimeProcess;
};

const runtimeProcess = (globalThis as RuntimeGlobal).process;

export const supabaseUrl =
  runtimeProcess?.env?.SUPABASE_URL?.trim() || DIARYQU_SUPABASE_URL;

export const supabasePublicKey =
  runtimeProcess?.env?.SUPABASE_PUBLISHABLE_KEY?.trim() ||
  runtimeProcess?.env?.SUPABASE_ANON_KEY?.trim() ||
  DIARYQU_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
}
