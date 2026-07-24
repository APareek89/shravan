create extension if not exists pgcrypto;
create schema if not exists shravan;

create table if not exists shravan.profiles (
  id uuid primary key,
  role text check (role in ('guardian', 'elder')) not null,
  full_name text not null,
  email text,
  phone text,
  language text default 'hi' check (language in ('hi', 'en')),
  subscribed boolean default true not null,
  created_at timestamptz default now() not null
);

create table if not exists shravan.elders (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid references shravan.profiles(id) on delete cascade not null,
  profile_id uuid references shravan.profiles(id) on delete set null,
  name text not null,
  nickname text,
  city text,
  language text default 'hi' check (language in ('hi', 'en')),
  interests text[] default '{}'::text[] not null,
  invite_token text unique,
  invite_expires_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists shravan.medications (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  name text not null,
  dosage text,
  slot text check (slot in ('morning', 'afternoon', 'evening', 'night')) not null,
  notes text,
  active boolean default true not null,
  created_at timestamptz default now() not null
);

create table if not exists shravan.med_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references shravan.medications(id) on delete cascade not null,
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  taken_at timestamptz default now() not null,
  log_date date not null,
  unique (medication_id, log_date)
);

create table if not exists shravan.conversations (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  kind text check (kind in ('checkin', 'scam_check', 'free_chat')) not null,
  started_at timestamptz default now() not null
);

create table if not exists shravan.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references shravan.conversations(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now() not null
);

create table if not exists shravan.checkins (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  conversation_id uuid references shravan.conversations(id) on delete set null,
  checkin_date date not null,
  slept_well boolean,
  ate_meals boolean,
  meals_note text,
  mood_score int check (mood_score between 1 and 5),
  mobility_ok boolean,
  pain_note text,
  concerns text,
  summary text,
  created_at timestamptz default now() not null,
  unique (elder_id, checkin_date)
);

create table if not exists shravan.alerts (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  kind text check (kind in ('MISSED_CHECKIN', 'LOW_MOOD', 'SCAM_HIGH', 'URGENT')) not null,
  detail text,
  dedupe_key text unique,
  created_at timestamptz default now() not null,
  acknowledged boolean default false not null
);

create table if not exists shravan.digests (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  week_start date not null,
  content text not null,
  created_at timestamptz default now() not null,
  unique (elder_id, week_start)
);

create table if not exists shravan.token_usage (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references shravan.elders(id) on delete cascade not null,
  usage_date date not null,
  input_tokens int default 0 not null check (input_tokens >= 0),
  output_tokens int default 0 not null check (output_tokens >= 0),
  updated_at timestamptz default now() not null,
  unique (elder_id, usage_date)
);

create index if not exists elders_guardian_idx on shravan.elders(guardian_id);
create index if not exists elders_profile_idx on shravan.elders(profile_id);
create index if not exists checkins_elder_date_idx on shravan.checkins(elder_id, checkin_date desc);
create index if not exists alerts_elder_created_idx on shravan.alerts(elder_id, created_at desc);
create index if not exists messages_conversation_created_idx on shravan.messages(conversation_id, created_at);

create or replace function shravan.current_user_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  )
$$;

create or replace function shravan.can_access_elder(target_elder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = shravan, public
as $$
  select exists (
    select 1
    from shravan.elders e
    where e.id = target_elder_id
      and (e.guardian_id = shravan.current_user_id() or e.profile_id = shravan.current_user_id())
  )
$$;

alter table shravan.profiles enable row level security;
alter table shravan.elders enable row level security;
alter table shravan.medications enable row level security;
alter table shravan.med_logs enable row level security;
alter table shravan.conversations enable row level security;
alter table shravan.messages enable row level security;
alter table shravan.checkins enable row level security;
alter table shravan.alerts enable row level security;
alter table shravan.digests enable row level security;
alter table shravan.token_usage enable row level security;

drop policy if exists profiles_self on shravan.profiles;
create policy profiles_self on shravan.profiles
  for all to authenticated
  using (id = shravan.current_user_id())
  with check (id = shravan.current_user_id());

drop policy if exists elders_family on shravan.elders;
create policy elders_family on shravan.elders
  for all to authenticated
  using (guardian_id = shravan.current_user_id() or profile_id = shravan.current_user_id())
  with check (guardian_id = shravan.current_user_id() or profile_id = shravan.current_user_id());

drop policy if exists medications_family on shravan.medications;
create policy medications_family on shravan.medications
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

drop policy if exists med_logs_family on shravan.med_logs;
create policy med_logs_family on shravan.med_logs
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

drop policy if exists conversations_family on shravan.conversations;
create policy conversations_family on shravan.conversations
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

drop policy if exists messages_family on shravan.messages;
create policy messages_family on shravan.messages
  for all to authenticated
  using (
    exists (
      select 1 from shravan.conversations c
      where c.id = conversation_id and shravan.can_access_elder(c.elder_id)
    )
  )
  with check (
    exists (
      select 1 from shravan.conversations c
      where c.id = conversation_id and shravan.can_access_elder(c.elder_id)
    )
  );

drop policy if exists checkins_family on shravan.checkins;
create policy checkins_family on shravan.checkins
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

drop policy if exists alerts_family on shravan.alerts;
create policy alerts_family on shravan.alerts
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

drop policy if exists digests_family on shravan.digests;
create policy digests_family on shravan.digests
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

drop policy if exists token_usage_family on shravan.token_usage;
create policy token_usage_family on shravan.token_usage
  for all to authenticated
  using (shravan.can_access_elder(elder_id))
  with check (shravan.can_access_elder(elder_id));

grant usage on schema shravan to authenticated, service_role;
grant select, insert, update, delete on all tables in schema shravan to authenticated, service_role;
grant execute on function shravan.current_user_id() to authenticated, service_role;
grant execute on function shravan.can_access_elder(uuid) to authenticated, service_role;

create or replace function shravan.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = shravan, public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') = 'shravan' then
    insert into shravan.profiles (id, role, full_name, email, language)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'role', 'guardian'),
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Guardian'), '@', 1)),
      new.email,
      coalesce(new.raw_user_meta_data ->> 'language', 'en')
    )
    on conflict (id) do update
      set email = excluded.email,
          full_name = coalesce(nullif(shravan.profiles.full_name, ''), excluded.full_name);
  end if;
  return new;
end;
$$;

drop trigger if exists on_shravan_auth_user_created on auth.users;
create trigger on_shravan_auth_user_created
  after insert or update of email on auth.users
  for each row execute procedure shravan.handle_new_auth_user();

