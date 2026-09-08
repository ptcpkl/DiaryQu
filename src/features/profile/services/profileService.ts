import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_SESSION, DEMO_USER_ID} from '../../../mocks/demoData';
import type {UserProfile, UserProfileDraft} from '../types';

type ProfileRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
};

let demoProfile: UserProfile = {
  id: DEMO_USER_ID,
  email: DEMO_SESSION.user.email ?? null,
  fullName: 'Pak Dahlan',
  avatarUrl: null,
  phoneNumber: '+62 812-3456-7890',
};

function mapProfile(row: ProfileRow, email: string | null): UserProfile {
  return {
    id: row.id,
    email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    phoneNumber: row.phone_number,
  };
}

export const profileService = {
  async getMyProfile(): Promise<UserProfile> {
    if (FRONTEND_DEMO_MODE) {
      return {...demoProfile};
    }

    const client = getSupabaseClient();
    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error('AUTH_REQUIRED');

    const {data, error} = await client
      .from('profiles')
      .select('id, full_name, avatar_url, phone_number')
      .eq('id', user.id)
      .single();
    if (error) throw error;

    return mapProfile(data as ProfileRow, user.email ?? null);
  },

  async updateMyProfile(draft: UserProfileDraft): Promise<UserProfile> {
    const fullName = draft.fullName.trim();
    const phoneNumber = draft.phoneNumber?.trim() || null;

    if (FRONTEND_DEMO_MODE) {
      demoProfile = {...demoProfile, fullName, phoneNumber};
      return {...demoProfile};
    }

    const client = getSupabaseClient();
    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error('AUTH_REQUIRED');

    const {data, error} = await client
      .from('profiles')
      .update({full_name: fullName, phone_number: phoneNumber})
      .eq('id', user.id)
      .select('id, full_name, avatar_url, phone_number')
      .single();
    if (error) throw error;

    const {error: metadataError} = await client.auth.updateUser({
      data: {full_name: fullName},
    });
    if (metadataError) throw metadataError;

    return mapProfile(data as ProfileRow, user.email ?? null);
  },
};
