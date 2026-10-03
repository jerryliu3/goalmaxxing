-- Briefings retain their fact version; presentation and generation have separate identities.
alter table public.user_digests add column facts_digest text;
alter table public.user_digests add column recap_snapshot jsonb;
alter table public.user_digests add column generated_at timestamptz;
alter table public.user_digests add column generation_token uuid;
alter table public.user_digests add column generation_deadline timestamptz;
create table public.digest_presentations (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null, digest_id uuid not null references public.user_digests(id) on delete cascade,
  presented_at timestamptz not null default now(), primary key(owner_id,local_date)
);
alter table public.digest_presentations enable row level security;
revoke all on public.digest_presentations from public,anon,authenticated;
grant select on public.digest_presentations to authenticated;
grant all on public.digest_presentations to service_role;
create policy owner_read on public.digest_presentations for select to authenticated using(owner_id=(select auth.uid()));
revoke insert,update on public.user_digests from authenticated;
grant all on public.user_digests to service_role;

create function public.ensure_digest_offer(p_owner uuid,p_kind text,p_key date,p_facts jsonb,p_digest text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.user_digests;
begin
  insert into public.user_digests(owner_id,kind,period_key,facts,facts_digest,recap_snapshot) values(p_owner,p_kind,p_key,p_facts,p_digest,p_facts) on conflict(owner_id,kind,period_key) do nothing;
  select * into r from public.user_digests where owner_id=p_owner and kind=p_kind and period_key=p_key;
  return to_jsonb(r);
end $$;
create function public.acknowledge_digest_offer(p_owner uuid,p_id uuid,p_day date)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.user_digests where id=p_id and owner_id=p_owner and period_key=p_day) then raise exception 'digest_reference_invalid'; end if;
  insert into public.digest_presentations(owner_id,local_date,digest_id) values(p_owner,p_day,p_id) on conflict do nothing;
  if not found then return false; end if;
  update public.user_digests set acknowledged_at=coalesce(acknowledged_at,now()) where id=p_id and owner_id=p_owner;
  return true;
end $$;
create function public.claim_digest_generation(p_owner uuid,p_id uuid,p_digest text,p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.user_digests;
begin
  select * into r from public.user_digests where id=p_id and owner_id=p_owner for update;
  if not found then raise exception 'digest_reference_invalid'; end if;
  if r.facts_digest=p_digest and r.suggestions is not null then return jsonb_build_object('claimed',false,'cached',r.suggestions,'generatedAt',r.generated_at); end if;
  if r.generation_deadline>now() then raise exception 'digest_generating'; end if;
  update public.user_digests set generation_token=p_token,generation_deadline=now()+interval '60 seconds' where id=p_id;
  return jsonb_build_object('claimed',true,'cached',null);
end $$;
create function public.finish_digest_generation(p_owner uuid,p_id uuid,p_token uuid,p_facts jsonb,p_digest text,p_suggestions jsonb,p_revision bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_revision bigint;
begin
  select revision into current_revision from public.coach_context_versions where owner_id=p_owner for share;
  if p_revision is null or coalesce(current_revision,0)<>p_revision then raise exception 'digest_context_changed'; end if;
  update public.user_digests set facts=p_facts,facts_digest=p_digest,suggestions=p_suggestions,generated_at=now(),generation_token=null,generation_deadline=null where id=p_id and owner_id=p_owner and generation_token=p_token and generation_deadline>now();
  return found;
end $$;
revoke all on function public.ensure_digest_offer(uuid,text,date,jsonb,text),public.acknowledge_digest_offer(uuid,uuid,date),public.claim_digest_generation(uuid,uuid,text,uuid),public.finish_digest_generation(uuid,uuid,uuid,jsonb,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.ensure_digest_offer(uuid,text,date,jsonb,text),public.acknowledge_digest_offer(uuid,uuid,date),public.claim_digest_generation(uuid,uuid,text,uuid),public.finish_digest_generation(uuid,uuid,uuid,jsonb,text,jsonb,bigint) to service_role;
