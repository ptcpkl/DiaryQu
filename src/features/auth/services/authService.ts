import type {Session} from '@supabase/supabase-js';

import {getSupabaseClient} from '../../../lib/supabase/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
}

export type RegisterResult = {
  session: Session | null;
  requiresEmailConfirmation: boolean;
};

export const AUTH_REDIRECT_URL = 'diaryqu://auth/callback';

function callbackParams(url: string): URLSearchParams {
  const fragmentIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const raw =
    fragmentIndex >= 0
      ? url.slice(fragmentIndex + 1)
      : queryIndex >= 0
        ? url.slice(queryIndex + 1)
        : '';
  return new URLSearchParams(raw);
}

export const authService = {
  async getSession(): Promise<Session | null> {
    const {data, error} = await getSupabaseClient().auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  },

  async signInWithPassword({
    email,
    password,
  }: LoginCredentials): Promise<Session> {
    const {data, error} = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('SESSION_NOT_CREATED');
    }

    return data.session;
  },

  async register({
    fullName,
    email,
    password,
  }: RegisterCredentials): Promise<RegisterResult> {
    const {data, error} = await getSupabaseClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    return {
      session: data.session,
      requiresEmailConfirmation: !data.session,
    };
  },

  async getGoogleOAuthUrl(): Promise<string> {
    const {data, error} = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: AUTH_REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }
    if (!data.url) {
      throw new Error('GOOGLE_OAUTH_URL_MISSING');
    }

    return data.url;
  },

  async completeOAuthCallback(url: string): Promise<Session> {
    if (!url.startsWith(AUTH_REDIRECT_URL)) {
      throw new Error('INVALID_AUTH_CALLBACK');
    }

    const params = callbackParams(url);
    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) {
      throw new Error(oauthError);
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const {data, error} = await getSupabaseClient().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      if (!data.session) throw new Error('SESSION_NOT_CREATED');
      return data.session;
    }

    const code = params.get('code');
    if (code) {
      const {data, error} = await getSupabaseClient().auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (!data.session) throw new Error('SESSION_NOT_CREATED');
      return data.session;
    }

    throw new Error('INVALID_AUTH_CALLBACK');
  },

  async signOut(): Promise<void> {
    const {error} = await getSupabaseClient().auth.signOut();

    if (error) {
      throw error;
    }
  },

  subscribe(onSessionChange: (session: Session | null) => void): () => void {
    const {data} = getSupabaseClient().auth.onAuthStateChange(
      (_event, session) => {
        onSessionChange(session);
      },
    );

    return () => data.subscription.unsubscribe();
  },
};
