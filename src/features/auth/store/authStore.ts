import type {Session} from '@supabase/supabase-js';
import {create} from 'zustand';

import {isSupabaseConfigured} from '../../../lib/supabase/client';
import {authService, type LoginCredentials} from '../services/authService';

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';

interface AuthState {
  session: Session | null;
  status: AuthStatus;
  isSubmitting: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'SUPABASE_NOT_CONFIGURED') {
      return 'Supabase belum dikonfigurasi pada environment aplikasi.';
    }

    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return 'Email atau password tidak sesuai.';
    }
  }

  return 'Terjadi kendala. Silakan coba lagi.';
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  status: 'booting',
  isSubmitting: false,
  error: null,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({status: 'unauthenticated', session: null});
      return undefined;
    }

    try {
      const session = await authService.getSession();
      set({
        session,
        status: session ? 'authenticated' : 'unauthenticated',
      });

      return authService.subscribe(nextSession => {
        set({
          session: nextSession,
          status: nextSession ? 'authenticated' : 'unauthenticated',
        });
      });
    } catch (error) {
      set({
        session: null,
        status: 'unauthenticated',
        error: toUserMessage(error),
      });
      return undefined;
    }
  },

  signIn: async credentials => {
    set({isSubmitting: true, error: null});

    try {
      const session = await authService.signInWithPassword(credentials);
      set({session, status: 'authenticated', isSubmitting: false});
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
    }
  },

  signOut: async () => {
    set({isSubmitting: true, error: null});

    try {
      if (isSupabaseConfigured) {
        await authService.signOut();
      }
      set({session: null, status: 'unauthenticated', isSubmitting: false});
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
    }
  },

  clearError: () => set({error: null}),
}));
