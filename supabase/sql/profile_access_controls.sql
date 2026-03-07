/*
  File Name: profile_access_controls.sql

  Description:
  Supabase SQL to enforce profile visibility as:
  - user can view their own profile/content
  - user can view accepted friends' profile/content

  This script also adds an RPC for username search used by AddFriendModal,
  so friend discovery still works when `users` select RLS is restrictive.

  Run this script in the Supabase SQL Editor for your project.
*/

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friend_requests fr
    where fr.status = 'accepted'
      and (
        (fr.requester_id = user_a and fr.recipient_id = user_b)
        or (fr.requester_id = user_b and fr.recipient_id = user_a)
      )
  );
$$;

create or replace function public.has_pending_friend_link(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friend_requests fr
    where fr.status = 'pending'
      and (
        (fr.requester_id = user_a and fr.recipient_id = user_b)
        or (fr.requester_id = user_b and fr.recipient_id = user_a)
      )
  );
$$;

create or replace function public.can_view_profile(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      auth.uid() = target_user
      or public.are_friends(auth.uid(), target_user)
    );
$$;

create or replace function public.find_user_by_username_for_request(search_username text)
returns table (
  id uuid,
  username text,
  first_name text,
  last_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.username, u.first_name, u.last_name
  from public.users u
  where lower(u.username) = lower(trim(search_username))
    and u.id <> auth.uid()
  limit 1;
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
revoke all on function public.has_pending_friend_link(uuid, uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.find_user_by_username_for_request(text) from public;

grant execute on function public.are_friends(uuid, uuid) to authenticated;
grant execute on function public.has_pending_friend_link(uuid, uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.find_user_by_username_for_request(text) to authenticated;

-- normalize and enforce required usernames
update public.users
set username = lower(trim(username))
where username is not null
  and username <> lower(trim(username));

update public.users
set username = 'user_' || left(replace(id::text, '-', ''), 8)
where username is null
  or trim(username) = '';

alter table public.users
alter column username set not null;

-- users visibility: self, accepted friends, or pending-request counterpart
alter table public.users enable row level security;
drop policy if exists users_select_visible_profiles on public.users;
create policy users_select_visible_profiles
on public.users
for select
to authenticated
using (
  auth.uid() = id
  or public.are_friends(auth.uid(), id)
  or public.has_pending_friend_link(auth.uid(), id)
);

-- posts visibility: self or accepted friends
alter table public.posts enable row level security;
drop policy if exists posts_select_owner_or_friend on public.posts;
create policy posts_select_owner_or_friend
on public.posts
for select
to authenticated
using (public.can_view_profile(user_id));

drop policy if exists posts_insert_owner_only on public.posts;
create policy posts_insert_owner_only
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists posts_update_owner_only on public.posts;
create policy posts_update_owner_only
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists posts_delete_owner_only on public.posts;
create policy posts_delete_owner_only
on public.posts
for delete
to authenticated
using (auth.uid() = user_id);

-- bulletin visibility: self or accepted friends
alter table public.bulletin_components enable row level security;
drop policy if exists bulletin_select_owner_or_friend on public.bulletin_components;
create policy bulletin_select_owner_or_friend
on public.bulletin_components
for select
to authenticated
using (public.can_view_profile(user_id));

drop policy if exists bulletin_insert_owner_only on public.bulletin_components;
create policy bulletin_insert_owner_only
on public.bulletin_components
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists bulletin_update_owner_only on public.bulletin_components;
create policy bulletin_update_owner_only
on public.bulletin_components
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists bulletin_delete_owner_only on public.bulletin_components;
create policy bulletin_delete_owner_only
on public.bulletin_components
for delete
to authenticated
using (auth.uid() = user_id);
