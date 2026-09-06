import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

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

export const supabaseUrl = runtimeProcess?.env?.SUPABASE_URL?.trim() ?? '';
export const supabasePublishableKey =
  runtimeProcess?.env?.SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
export const supabaseAnonKey =
  runtimeProcess?.env?.SUPABASE_ANON_KEY?.trim() ?? '';

// Supabase recommends publishable keys for new clients. Keep legacy anon-key
// fallback so existing environments continue to work during migration.
export const supabaseClientKey = supabasePublishableKey || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseClientKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseClientKey, {
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
