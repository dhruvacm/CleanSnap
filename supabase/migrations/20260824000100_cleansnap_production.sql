-- CleanSnap production foundation. Safe to run after the original migrations.

alter table public.profiles add column if not exists role text not null default 'citizen' check (role in ('citizen','admin','municipality'));

alter table public.reports add column if not exists ai_confidence numeric;
alter table public.reports add column if not exists status text not null default 'submitted' check (status in ('submitted','ai_verified','assigned','in_progress','resolved'));
alter table public.reports add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists admin_comment text;
alter table public.reports add column if not exists updated_at timestamptz not null default now();
alter table public.reports add column if not exists resolved_at timestamptz;

create table if not exists public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  comment text,
  created_at timestamptz not null default now()
);
alter table public.report_status_history enable row level security;

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  points_required integer not null check (points_required > 0),
  stock integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.rewards enable row level security;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

insert into public.rewards(name,description,points_required,stock) values
('Plant a Tree Certificate','Support a local tree-planting initiative.',150,null),
('Eco Store Discount 20%','20% off at participating eco stores.',200,null),
('Free Bus Pass (1 Day)','A one-day public transport pass.',300,100),
('₹50 Grocery Coupon','A community partner grocery coupon.',500,100)
on conflict (name) do nothing;

-- Storage bucket. If dashboard policies already exist, these are idempotent by name.
insert into storage.buckets(id,name,public) values ('report-images','report-images',true) on conflict (id) do nothing;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where user_id=auth.uid() and role in ('admin','municipality'));
$$;

create or replace function public.create_report(
  p_image_url text,
  p_location_text text,
  p_latitude double precision,
  p_longitude double precision,
  p_garbage_type text,
  p_severity text,
  p_ai_analysis text,
  p_ai_confidence numeric default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare new_id uuid; pts integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  pts := case lower(p_severity) when 'small' then 20 when 'medium' then 50 when 'large' then 100 when 'extreme' then 200 else 0 end;
  if pts = 0 then raise exception 'Invalid severity'; end if;
  insert into public.reports(user_id,image_url,location_text,latitude,longitude,garbage_type,severity,points_earned,ai_analysis,ai_confidence,status)
  values(auth.uid(),p_image_url,p_location_text,p_latitude,p_longitude,p_garbage_type,p_severity,pts,p_ai_analysis,p_ai_confidence,'ai_verified') returning id into new_id;
  update public.profiles set points=coalesce(points,0)+pts,reports_count=coalesce(reports_count,0)+1,updated_at=now() where user_id=auth.uid();
  insert into public.report_status_history(report_id,status,changed_by) values(new_id,'submitted',auth.uid()),(new_id,'ai_verified',auth.uid());
  insert into public.notifications(user_id,title,message,type) values(auth.uid(),'Report submitted',format('Your %s report was verified and earned %s points.',coalesce(p_garbage_type,'waste'),pts),'report');
  return new_id;
end;
$$;

create or replace function public.update_report_status(p_report_id uuid,p_status text,p_comment text default '') returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  if p_status not in ('submitted','ai_verified','assigned','in_progress','resolved') then raise exception 'Invalid status'; end if;
  update public.reports set status=p_status,admin_comment=nullif(p_comment,''),updated_at=now(),resolved_at=case when p_status='resolved' then now() else resolved_at end where id=p_report_id;
  insert into public.report_status_history(report_id,status,changed_by,comment) values(p_report_id,p_status,auth.uid(),nullif(p_comment,''));
  insert into public.notifications(user_id,title,message,type) select user_id,'Report status updated',format('Your report is now %s.',replace(p_status,'_',' ')),'status' from public.reports where id=p_report_id;
end;
$$;

create or replace function public.redeem_reward(p_reward_name text,p_points integer) returns void language plpgsql security definer set search_path=public as $$
declare current_points integer; required integer; stock_count integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select points into current_points from public.profiles where user_id=auth.uid() for update;
  select points_required,stock into required,stock_count from public.rewards where name=p_reward_name and active=true for update;
  if required is null then raise exception 'Reward unavailable'; end if;
  if p_points <> required then raise exception 'Invalid reward cost'; end if;
  if current_points < required then raise exception 'Not enough points'; end if;
  if stock_count is not null and stock_count <= 0 then raise exception 'Reward out of stock'; end if;
  update public.profiles set points=points-required,updated_at=now() where user_id=auth.uid();
  if stock_count is not null then update public.rewards set stock=stock-1 where name=p_reward_name; end if;
  insert into public.redemptions(user_id,reward_name,points_spent) values(auth.uid(),p_reward_name,required);
  insert into public.notifications(user_id,title,message,type) values(auth.uid(),'Reward redeemed',format('%s was redeemed for %s points.',p_reward_name,required),'reward');
end;
$$;

create or replace function public.update_report_timestamp() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports for each row execute function public.update_report_timestamp();

-- Policies
 drop policy if exists "Staff can view all reports" on public.reports;
create policy "Staff can view all reports" on public.reports for select to authenticated using (auth.uid()=user_id or public.is_staff());
drop policy if exists "Staff can update reports" on public.reports;
create policy "Staff can update reports" on public.reports for update to authenticated using (public.is_staff()) with check (public.is_staff());

 drop policy if exists "Users can view own history" on public.report_status_history;
create policy "Users can view own history" on public.report_status_history for select to authenticated using (exists(select 1 from public.reports r where r.id=report_id and (r.user_id=auth.uid() or public.is_staff())));
drop policy if exists "Staff can insert history" on public.report_status_history;
create policy "Staff can insert history" on public.report_status_history for insert to authenticated with check (public.is_staff() or changed_by=auth.uid());

 drop policy if exists "Rewards are public" on public.rewards;
create policy "Rewards are public" on public.rewards for select to authenticated using (active=true or public.is_staff());
drop policy if exists "Staff manage rewards" on public.rewards;
create policy "Staff manage rewards" on public.rewards for all to authenticated using (public.is_staff()) with check (public.is_staff());

 drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications" on public.notifications for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Storage access: users may upload into their own folder; public read is enabled by the public bucket.
drop policy if exists "Users upload report images" on storage.objects;
create policy "Users upload report images" on storage.objects for insert to authenticated with check (bucket_id='report-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users manage report images" on storage.objects;
create policy "Users manage report images" on storage.objects for delete to authenticated using (bucket_id='report-images' and (storage.foldername(name))[1]=auth.uid()::text);

-- Only the trusted RPC may create reports; direct inserts would allow point manipulation.
drop policy if exists "Users can insert own reports" on public.reports;

-- Public-safe community map view (no user id, email, or private metadata).
create or replace view public.community_reports as
select id, location_text, latitude, longitude, garbage_type, severity, status, created_at
from public.reports;
grant select on public.community_reports to authenticated;

revoke all on function public.create_report(text,text,double precision,double precision,text,text,text,numeric) from public;
grant execute on function public.create_report(text,text,double precision,double precision,text,text,text,numeric) to authenticated;
revoke all on function public.update_report_status(uuid,text,text) from public;
grant execute on function public.update_report_status(uuid,text,text) to authenticated;
revoke all on function public.redeem_reward(text,integer) from public;
grant execute on function public.redeem_reward(text,integer) to authenticated;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- Prevent citizens from promoting themselves to staff.
create or replace function public.protect_profile_role() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and auth.uid() = new.user_id and old.role is distinct from new.role and not public.is_staff() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute function public.protect_profile_role();
