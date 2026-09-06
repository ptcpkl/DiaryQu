-- Family codes are invitation tokens. Use six characters from a 32-character
-- alphabet (30 bits of entropy) and avoid ambiguous characters such as I/O/0/1.

alter table public.families
  drop constraint if exists families_family_code_format_check;

alter table public.families
  add constraint families_family_code_format_check
  check (family_code ~ '^DQ-[A-HJ-NP-Z2-9]{6}$');

create or replace function public.generate_family_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea;
  suffix text;
  candidate text;
  i integer;
begin
  loop
    random_bytes := gen_random_bytes(6);
    suffix := '';

    for i in 0..5 loop
      suffix := suffix || substr(
        alphabet,
        (get_byte(random_bytes, i) % char_length(alphabet)) + 1,
        1
      );
    end loop;

    candidate := 'DQ-' || suffix;

    exit when not exists (
      select 1 from public.families where family_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

revoke all on function public.generate_family_code() from public;
