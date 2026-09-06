-- Keep security-sensitive identifiers and timestamps server-controlled.

revoke update on table public.profiles from authenticated;
revoke update on table public.families from authenticated;

-- A user may edit only their user-facing profile fields; RLS still restricts rows to self.
grant update (full_name, avatar_url, phone_number)
on table public.profiles
to authenticated;

-- Family code, creator, and timestamps remain server-controlled.
-- A head may rename the family because the families_update_head RLS policy still applies.
grant update (name)
on table public.families
to authenticated;
