create table public.coach_context_versions (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  revision bigint not null default 0, updated_at timestamptz not null default now()
);
alter table public.coach_context_versions enable row level security;
revoke all on public.coach_context_versions from public,anon,authenticated;
grant select on public.coach_context_versions to authenticated;
grant all on public.coach_context_versions to service_role;
create policy owner_read on public.coach_context_versions for select to authenticated using(owner_id=(select auth.uid()));
insert into public.coach_context_versions(owner_id) select id from public.profiles on conflict do nothing;
create function private.bump_coach_context() returns trigger language plpgsql security definer set search_path='' as $$
declare row_data jsonb; owner uuid;
begin
  row_data:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  owner:=(row_data->>tg_argv[0])::uuid;
  insert into public.coach_context_versions(owner_id,revision) select owner,1 where exists(select 1 from public.profiles where id=owner)
    on conflict(owner_id) do update set revision=public.coach_context_versions.revision+1,updated_at=now();
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function private.bump_coach_context() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['goals','goal_links','planner_items','planner_tasks','coach_memories'] loop
    execute format('create trigger coach_context_changed after insert or update or delete on public.%I for each row execute function private.bump_coach_context(''owner_id'')',t);
  end loop;
end $$;
create trigger coach_context_changed after insert or update or delete on public.completions for each row execute function private.bump_coach_context('user_id');
create trigger coach_profile_changed after insert or update on public.profiles for each row execute function private.bump_coach_context('id');
-- A single tiny owner-filtered row is sufficient; never broadcast private transcripts.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='coach_context_versions') then
    alter publication supabase_realtime add table public.coach_context_versions;
  end if;
end $$;

-- Publishing an answer and its proposals uses the same live-fact fence as loading.
create or replace function public.finish_coach_run(p_owner uuid,p_run uuid,p_content text,p_source jsonb,p_actions jsonb default '[]')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.coach_runs; v integer; a jsonb; m public.coach_messages; revision bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(p_owner));
  -- Lock ordering matches begin: owner, thread, then run.
  perform 1 from public.coach_threads t where t.id=(select thread_id from public.coach_runs where id=p_run and owner_id=p_owner) for update;
  select * into r from public.coach_runs where id=p_run and owner_id=p_owner for update;
  if not found then raise exception 'run_not_found'; end if;
  if r.status<>'running' or r.deadline<now() then raise exception 'run_expired'; end if;
  if exists(select 1 from public.coach_threads t join public.coach_topics topic on topic.id=t.topic_id where t.id=r.thread_id and (t.archived_at is not null or topic.archived_at is not null)) then raise exception 'topic_archived'; end if;
  if p_source ? 'revision' then
    select context.revision into revision from public.coach_context_versions context where owner_id=p_owner for share;
    if coalesce(revision,0)::text is distinct from p_source->>'revision' then raise exception 'context_refresh_required'; end if;
  end if;
  update public.coach_threads set version=version+1,updated_at=now() where id=r.thread_id returning version into v;
  insert into public.coach_messages(owner_id,thread_id,sequence,role,content,run_id,source)
    values(p_owner,r.thread_id,v,'assistant',p_content,p_run,p_source) returning * into m;
  for a in select value from jsonb_array_elements(p_actions) loop
    insert into public.coach_actions(owner_id,thread_id,run_id,kind,title,command,preview,inverse)
      values(p_owner,r.thread_id,p_run,a->>'kind',a->>'title',a->'command',a->'preview',nullif(a->'inverse','null'::jsonb));
  end loop;
  update public.coach_runs set status='completed',context_revision=p_source->>'revision',completed_at=now() where id=p_run;
  return to_jsonb(m);
end $$;
