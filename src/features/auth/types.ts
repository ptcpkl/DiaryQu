export interface AppUserMetadata extends Record<string, unknown> {
  full_name?: string;
}

export interface AppUser {
  id: string;
  email?: string;
  user_metadata: AppUserMetadata;
}

export interface AppSession {
  user: AppUser;
}
