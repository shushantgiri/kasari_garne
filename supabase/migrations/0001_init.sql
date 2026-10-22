-- Kasari Garne — initial schema
-- Run in the Supabase SQL editor or with `supabase db push`.

create extension if not exists pgcrypto;

-- Admins: link a Supabase Auth user to an editor role.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'editor' check (role in ('editor', 'reviewer', 'owner')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.is_reviewer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and role in ('reviewer', 'owner'));
$$;

-- Departments (categories)
create table if not exists public.departments (
  id text primary key,
  name jsonb not null,   -- {"ne": "...", "en": "..."}
  short jsonb not null,
  url text not null check (url like 'https://%'),
  created_at timestamptz not null default now()
);

-- Guides: the full bilingual guide lives in `data` (see src/lib/content/types.ts);
-- columns hold what we filter on and what RLS / checks need.
create table if not exists public.guides (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  department_id text not null references public.departments (id),
  status text not null default 'draft' check (status in ('draft', 'under_review', 'verified', 'needs_update', 'archived')),
  published boolean not null default false,
  coming_soon boolean not null default false,
  data jsonb not null,
  last_checked date,
  checked_by uuid references auth.users (id),
  views integer not null default 0,
  reviewer uuid references auth.users (id),
  recheck_by date,
  -- Uploaded/rendered MP4s stay hidden until approved.
  video_review text not null default 'pending' check (video_review in ('pending', 'approved', 'rejected')),
  video_approved_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  -- "Verified" requires a check date and at least one official source.
  constraint archived_unpublished check (status <> 'archived' or not published),
  constraint verified_needs_evidence check (
    status <> 'verified' or (
      last_checked is not null
      and jsonb_path_exists(data, '$.sources[*] ? (@.official == true)')
    )
  )
);

create index if not exists guides_published_idx on public.guides (published, updated_at desc);

-- Version history so edits can be reviewed and rolled back.
create table if not exists public.guide_revisions (
  id bigserial primary key,
  slug text not null references public.guides (slug) on delete cascade,
  data jsonb not null,
  status text not null,
  published boolean not null,
  edited_by uuid references auth.users (id),
  edited_at timestamptz not null default now()
);

create or replace function public.guides_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  -- Only reviewers may set or keep a guide as Verified when its content changes.
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status <> 'verified' or old.data is distinct from new.data) then
    if auth.uid() is not null and not public.is_reviewer() then
      raise exception 'Only reviewers can mark a guide as verified';
    end if;
    new.checked_by := coalesce(auth.uid(), new.checked_by);
  end if;
  return new;
end $$;

drop trigger if exists guides_before_write on public.guides;
create trigger guides_before_write before insert or update on public.guides
for each row execute function public.guides_before_write();

create or replace function public.guides_after_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.guide_revisions (slug, data, status, published, edited_by)
  values (new.slug, new.data, new.status, new.published, auth.uid());
  return new;
end $$;

drop trigger if exists guides_after_write on public.guides;
create trigger guides_after_write after insert or update on public.guides
for each row execute function public.guides_after_write();

-- Correction reports from the public. No personal data is collected.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  guide_slug text references public.guides (slug) on delete set null,
  step_id text,
  message text not null check (char_length(message) between 5 and 2000),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  locale text not null default 'ne',
  state text not null default 'new' check (state in ('new', 'in_progress', 'resolved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- "Request a new guide" submissions.
create table if not exists public.guide_requests (
  id uuid primary key default gen_random_uuid(),
  service text not null check (char_length(service) between 2 and 200),
  details text check (details is null or char_length(details) <= 2000),
  locale text not null default 'ne',
  state text not null default 'new' check (state in ('new', 'planned', 'done', 'rejected')),
  created_at timestamptz not null default now()
);

-- "यो गाइड उपयोगी भयो?" — anonymous, no personal data.
create table if not exists public.feedback (
  id bigserial primary key,
  guide_slug text not null references public.guides (slug) on delete cascade,
  useful boolean not null,
  reason text check (reason is null or reason in ('hard_to_understand', 'outdated', 'missing_step', 'video_failed', 'other')),
  message text check (message is null or char_length(message) <= 1000),
  locale text not null default 'ne',
  created_at timestamptz not null default now()
);

-- Simple view counter for "most-watched".
create or replace function public.increment_views(p_slug text) returns void
language sql security definer set search_path = public as $$
  update public.guides set views = views + 1 where slug = p_slug and published;
$$;

-- ---------- Row Level Security ----------
alter table public.admins enable row level security;
alter table public.departments enable row level security;
alter table public.guides enable row level security;
alter table public.guide_revisions enable row level security;
alter table public.reports enable row level security;
alter table public.guide_requests enable row level security;
alter table public.feedback enable row level security;

-- Public: read departments, and guides that are published or teased as coming soon.
create policy departments_read on public.departments for select using (true);
create policy guides_public_read on public.guides for select using (published or coming_soon or public.is_admin());

-- Public may submit reports and requests, but never read them.
create policy reports_insert on public.reports for insert with check (state = 'new' and admin_note is null);
create policy requests_insert on public.guide_requests for insert with check (state = 'new');
create policy feedback_insert on public.feedback for insert with check (true);

-- Admins: full management.
create policy admins_self_read on public.admins for select using (user_id = auth.uid() or public.is_admin());
create policy departments_admin on public.departments for all using (public.is_admin()) with check (public.is_admin());
create policy guides_admin on public.guides for all using (public.is_admin()) with check (public.is_admin());
create policy revisions_admin on public.guide_revisions for select using (public.is_admin());
create policy reports_admin on public.reports for all using (public.is_admin()) with check (public.is_admin());
create policy requests_admin on public.guide_requests for all using (public.is_admin()) with check (public.is_admin());
create policy feedback_admin on public.feedback for select using (public.is_admin());

-- Only reviewers approve videos (enforced in the trigger below).
create or replace function public.guides_video_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.video_review = 'approved' and old.video_review is distinct from 'approved' then
    if auth.uid() is not null and not public.is_reviewer() then
      raise exception 'Only reviewers can approve a video';
    end if;
    new.video_approved_by := coalesce(auth.uid(), new.video_approved_by);
  end if;
  return new;
end $$;

drop trigger if exists guides_video_review on public.guides;
create trigger guides_video_review before update on public.guides
for each row execute function public.guides_video_review();

grant execute on function public.increment_views(text) to anon, authenticated;

-- Public, aggregated view of guide requests: only services asked for at least
-- three times are shown, and never the free-text details.
create or replace function public.top_requests(max_rows int default 6)
returns table (service text, count bigint)
language sql stable security definer set search_path = public as $$
  select min(service) as service, count(*) as count
  from public.guide_requests
  where state in ('new', 'planned')
  group by lower(trim(service))
  having count(*) >= 3
  order by count(*) desc
  limit max_rows;
$$;
grant execute on function public.top_requests(int) to anon, authenticated;

-- ---------- Storage: tutorial videos, posters, subtitles ----------
insert into storage.buckets (id, name, public)
values ('tutorials', 'tutorials', true)
on conflict (id) do nothing;

create policy tutorials_public_read on storage.objects for select using (bucket_id = 'tutorials');
create policy tutorials_admin_write on storage.objects for insert with check (bucket_id = 'tutorials' and public.is_admin());
create policy tutorials_admin_update on storage.objects for update using (bucket_id = 'tutorials' and public.is_admin());
create policy tutorials_admin_delete on storage.objects for delete using (bucket_id = 'tutorials' and public.is_admin());
