import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

type RuntimeProcess = {
  env?: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  };
};

type RuntimeGlobal = typeof globalThis & {
  process?: RuntimeProcess;
};

const runtimeProcess = (globalThis as RuntimeGlobal).process;

export const supabaseUrl = runtimeProcess?.env?.SUPABASE_URL?.trim() ?? '';
export const supabaseAnonKey =
  runtimeProcess?.env?.SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
