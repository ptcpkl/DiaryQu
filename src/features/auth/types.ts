export interface AppUser {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}

export interface AppSession {
  user: AppUser;
}
