import {create} from 'zustand';

import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {isSupabaseConfigured} from '../../../lib/supabase/client';
import {DEMO_SESSION} from '../../../mocks/demoData';
import {
  authService,
  type LoginCredentials,
  type RegisterCredentials,
} from '../services/authService';
import type {AppSession} from '../types';

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';
export type RegisterOutcome = 'authenticated' | 'verification_required' | 'error';

interface AuthState {
  session: AppSession | null;
  status: AuthStatus;
  isSubmitting: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<RegisterOutcome>;
  beginGoogleSignIn: () => Promise<string | null>;
  completeOAuthCallback: (url: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  applyProfileName: (fullName: string) => void;
  clearError: () => void;
}

function cloneDemoSession(): AppSession {
  return {
    ...DEMO_SESSION,
    user: {
      ...DEMO_SESSION.user,
      user_metadata: {...DEMO_SESSION.user.user_metadata},
    },
  };
}

function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();

    if (error.message === 'SUPABASE_NOT_CONFIGURED') {
      return 'Supabase belum dikonfigurasi pada environment aplikasi.';
    }
    if (normalized.includes('invalid login credentials')) {
      return 'Email atau password tidak sesuai.';
    }
    if (normalized.includes('user already registered')) {
      return 'Email tersebut sudah terdaftar. Silakan masuk.';
    }
    if (normalized.includes('password')) {
      return 'Password belum memenuhi ketentuan keamanan.';
    }
    if (normalized.includes('provider') || normalized.includes('oauth')) {
      return 'Login Google belum dapat digunakan. Periksa konfigurasi Google di Supabase.';
    }
    if (normalized.includes('network') || normalized.includes('fetch')) {
      return 'Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.';
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
    if (FRONTEND_DEMO_MODE) {
      set({
        status: 'unauthenticated',
        session: null,
        isSubmitting: false,
        error: null,
      });
      return undefined;
    }

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
          isSubmitting: false,
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

    if (FRONTEND_DEMO_MODE) {
      set({
        session: cloneDemoSession(),
        status: 'authenticated',
        isSubmitting: false,
        error: null,
      });
      return;
    }

    try {
      const session = await authService.signInWithPassword(credentials);
      set({session, status: 'authenticated', isSubmitting: false});
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
    }
  },

  register: async credentials => {
    set({isSubmitting: true, error: null});

    if (FRONTEND_DEMO_MODE) {
      const demo = cloneDemoSession();
      demo.user.email = credentials.email.trim();
      demo.user.user_metadata.full_name = credentials.fullName.trim();
      set({
        session: demo,
        status: 'authenticated',
        isSubmitting: false,
        error: null,
      });
      return 'authenticated';
    }

    try {
      const result = await authService.register(credentials);
      if (result.session) {
        set({session: result.session, status: 'authenticated', isSubmitting: false});
        return 'authenticated';
      }
      set({isSubmitting: false, status: 'unauthenticated'});
      return 'verification_required';
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
      return 'error';
    }
  },

  beginGoogleSignIn: async () => {
    set({isSubmitting: true, error: null});

    if (FRONTEND_DEMO_MODE) {
      set({
        session: cloneDemoSession(),
        status: 'authenticated',
        isSubmitting: false,
      });
      return null;
    }

    try {
      const url = await authService.getGoogleOAuthUrl();
      set({isSubmitting: false});
      return url;
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
      return null;
    }
  },

  completeOAuthCallback: async url => {
    if (FRONTEND_DEMO_MODE) return false;
    set({isSubmitting: true, error: null});
    try {
      const session = await authService.completeOAuthCallback(url);
      set({session, status: 'authenticated', isSubmitting: false});
      return true;
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
      return false;
    }
  },

  signOut: async () => {
    set({isSubmitting: true, error: null});

    if (FRONTEND_DEMO_MODE) {
      set({
        session: null,
        status: 'unauthenticated',
        isSubmitting: false,
        error: null,
      });
      return;
    }

    try {
      if (isSupabaseConfigured) {
        await authService.signOut();
      }
      set({session: null, status: 'unauthenticated', isSubmitting: false});
    } catch (error) {
      set({isSubmitting: false, error: toUserMessage(error)});
    }
  },

  applyProfileName: fullName =>
    set(state => ({
      session: state.session
        ? {
            ...state.session,
            user: {
              ...state.session.user,
              user_metadata: {
                ...state.session.user.user_metadata,
                full_name: fullName,
              },
            },
          }
        : null,
    })),

  clearError: () => set({error: null}),
}));
