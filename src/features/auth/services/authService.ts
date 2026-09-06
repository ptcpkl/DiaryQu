import type {Session} from '@supabase/supabase-js';

import {getSupabaseClient} from '../../../lib/supabase/client';

export interface LoginCredentials {
  email: string;
  password: string;
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
      email,
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
