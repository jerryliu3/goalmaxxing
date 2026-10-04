-- Durable conversations are independent of calendar pages and months.
create table public.coach_topics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  intention text not null default '' check (char_length(intention) <= 1000),
  summary text not null default '' check (char_length(summary) <= 4000),
  version integer not null default 0 check (version >= 0),
  is_default boolean not null default false,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create unique index coach_default_topic on public.coach_topics(owner_id) where is_default;
create table public.coach_threads (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null, title text not null check (char_length(title) between 1 and 120),
  version integer not null default 0 check (version >= 0),
  legacy_conversation_id uuid unique, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, owner_id), foreign key (topic_id, owner_id) references public.coach_topics(id, owner_id) on delete cascade
);
create index coach_threads_topic on public.coach_threads(owner_id, topic_id, updated_at desc);
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null,
  thread_id uuid not null, sequence integer not null check (sequence > 0),
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 16000),
  run_id uuid, source jsonb not null default '{}' check (jsonb_typeof(source) = 'object'),
  created_at timestamptz not null default now(),
  unique (id, owner_id), unique (thread_id, sequence),
  foreign key (thread_id, owner_id) references public.coach_threads(id, owner_id) on delete cascade
);
create table public.coach_runs (
  id uuid primary key, owner_id uuid not null, thread_id uuid not null,
  user_message_id uuid not null, payload_digest text not null, topic_version integer not null,
  status text not null default 'running' check (status in ('running','completed','failed','cancelled')),
  page_context jsonb not null, context_revision text, error_code text,
  created_at timestamptz not null default now(), deadline timestamptz not null default (now() + interval '90 seconds'),
  completed_at timestamptz,
  unique(id, owner_id),
  foreign key (thread_id, owner_id) references public.coach_threads(id, owner_id) on delete cascade
);
create unique index coach_one_running_turn on public.coach_runs(thread_id) where status = 'running';
create table public.coach_memories (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid, content text not null check (char_length(content) between 1 and 1000),
  kind text not null default 'preference' check (kind in ('preference','observation')),
  source_message_id uuid, version integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (topic_id, owner_id) references public.coach_topics(id, owner_id) on delete cascade,
  foreign key (source_message_id, owner_id) references public.coach_messages(id, owner_id) on delete cascade
);
create index coach_memories_owner_topic on public.coach_memories(owner_id, topic_id);
create table public.coach_topic_goals (
  topic_id uuid not null, owner_id uuid not null, goal_id uuid not null references public.goals(id) on delete cascade,
  primary key(topic_id, goal_id), foreign key(topic_id, owner_id) references public.coach_topics(id, owner_id) on delete cascade
);
create table public.coach_actions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null, thread_id uuid not null, run_id uuid not null,
  kind text not null, title text not null check (char_length(title) between 1 and 160),
  command jsonb not null, preview jsonb not null,
  status text not null default 'proposed' check (status in ('proposed','applied','rejected','superseded','undone')),
  result jsonb, inverse jsonb, inverse_of uuid references public.coach_actions(id) on delete set null,
  created_at timestamptz not null default now(), applied_at timestamptz,
  foreign key(thread_id, owner_id) references public.coach_threads(id, owner_id) on delete cascade,
  foreign key(run_id, owner_id) references public.coach_runs(id, owner_id) on delete cascade
);
create index coach_actions_thread on public.coach_actions(owner_id, thread_id, created_at);

-- Clients can inspect their data. Only the authenticated application server authors it.
do $$ declare t text; begin
  foreach t in array array['coach_topics','coach_threads','coach_messages','coach_runs','coach_memories','coach_topic_goals','coach_actions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy owner_read on public.%I for select to authenticated using (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

create function public.begin_coach_run(p_owner uuid, p_thread uuid, p_request uuid, p_content text, p_page jsonb, p_expected_version integer, p_digest text, p_retry uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.coach_threads; r public.coach_runs; m uuid := gen_random_uuid(); topic_version integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(p_owner));
  select * into t from public.coach_threads where id=p_thread and owner_id=p_owner for update;
  if not found or t.archived_at is not null then raise exception 'thread_not_found'; end if;
  if exists(select 1 from public.coach_topics where id=t.topic_id and archived_at is not null) then raise exception 'topic_archived'; end if;
  select * into r from public.coach_runs where id=p_request and owner_id=p_owner;
  if found then
    if r.payload_digest<>p_digest or r.thread_id<>p_thread then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('created',false,'run',to_jsonb(r));
  end if;
  update public.coach_runs set status='failed', error_code='run_expired', completed_at=now() where thread_id=p_thread and status='running' and deadline<now();
  if exists(select 1 from public.coach_runs where thread_id=p_thread and status='running') then raise exception 'thread_busy'; end if;
  if t.version<>p_expected_version then raise exception 'conversation_conflict'; end if;
  if p_retry is not null then
    select * into r from public.coach_runs where id=p_retry and thread_id=p_thread and owner_id=p_owner and status in ('failed','cancelled');
    if not found then raise exception 'retry_unavailable'; end if;
    if not exists(select 1 from public.coach_messages where id=r.user_message_id and content=p_content) then raise exception 'idempotency_conflict'; end if;
    if r.user_message_id<>(select id from public.coach_messages where thread_id=p_thread and role='user' order by sequence desc limit 1) then raise exception 'retry_unavailable'; end if;
    m:=r.user_message_id;
  else
    update public.coach_threads set version=version+1,updated_at=now() where id=p_thread returning * into t;
    insert into public.coach_messages(id,owner_id,thread_id,sequence,role,content,run_id,source)
      values(m,p_owner,p_thread,t.version,'user',p_content,p_request,jsonb_build_object('checkIn',p_page->'checkIn'));
  end if;
  -- An accepted turn fences summaries generated from older topic understanding.
  update public.coach_topics set version=version+1,updated_at=now() where id=t.topic_id returning version into topic_version;
  insert into public.coach_runs(id,owner_id,thread_id,user_message_id,payload_digest,page_context,topic_version)
    values(p_request,p_owner,p_thread,m,p_digest,p_page,topic_version) returning * into r;
  return jsonb_build_object('created',true,'run',to_jsonb(r));
end $$;
revoke all on function public.begin_coach_run(uuid,uuid,uuid,text,jsonb,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.begin_coach_run(uuid,uuid,uuid,text,jsonb,integer,text,uuid) to service_role;

create function public.finish_coach_run(p_owner uuid,p_run uuid,p_content text,p_source jsonb,p_actions jsonb default '[]')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.coach_runs; v integer; a jsonb; m public.coach_messages;
begin
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(p_owner));
  -- Lock ordering matches begin: owner, thread, then run.
  perform 1 from public.coach_threads t where t.id=(select thread_id from public.coach_runs where id=p_run and owner_id=p_owner) for update;
  select * into r from public.coach_runs where id=p_run and owner_id=p_owner for update;
  if not found then raise exception 'run_not_found'; end if;
  if r.status<>'running' or r.deadline<now() then raise exception 'run_expired'; end if;
  if exists(select 1 from public.coach_threads t join public.coach_topics topic on topic.id=t.topic_id where t.id=r.thread_id and (t.archived_at is not null or topic.archived_at is not null)) then raise exception 'topic_archived'; end if;
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
revoke all on function public.finish_coach_run(uuid,uuid,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.finish_coach_run(uuid,uuid,text,jsonb,jsonb) to service_role;

-- Legacy snapshots become readable history; old proposal metadata is not executable.
insert into public.coach_topics(owner_id,title,is_default)
select distinct owner_id,'My week',true from public.planner_coach_conversations on conflict do nothing;
insert into public.coach_threads(id,owner_id,topic_id,title,version,legacy_conversation_id,created_at,updated_at)
select c.id,c.owner_id,t.id,c.title,c.message_count,c.id,c.created_at,c.updated_at
from public.planner_coach_conversations c join public.coach_topics t on t.owner_id=c.owner_id and t.is_default
on conflict do nothing;
insert into public.coach_messages(owner_id,thread_id,sequence,role,content,source,created_at)
select m.owner_id,m.conversation_id,m.ordinal,m.role,m.content,jsonb_build_object('legacy',true,'scopeMonth',c.scope_month),m.created_at
from public.planner_coach_conversation_messages m join public.planner_coach_conversations c on c.id=m.conversation_id
on conflict(thread_id,sequence) do nothing;

create function public.ensure_coach_home(p_owner uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare topic uuid; thread uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(p_owner));
  insert into public.coach_topics(owner_id,title,is_default) values(p_owner,'My week',true) on conflict do nothing;
  select id into topic from public.coach_topics where owner_id=p_owner and is_default for update;
  select id into thread from public.coach_threads where topic_id=topic and archived_at is null and legacy_conversation_id is null order by created_at limit 1;
  if thread is null then
    insert into public.coach_threads(owner_id,topic_id,title) values(p_owner,topic,'My week') returning id into thread;
  end if;
  return thread;
end $$;
revoke all on function public.ensure_coach_home(uuid) from public, anon, authenticated;
grant execute on function public.ensure_coach_home(uuid) to service_role;

create function private.invalidate_coach_understanding() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.coach_topics set summary='',version=version+1 where owner_id=old.owner_id;
  if tg_op='UPDATE' then return new; end if;
  return old;
end $$;
create trigger coach_thread_deleted before delete on public.coach_threads for each row execute function private.invalidate_coach_understanding();
create trigger coach_memory_changed before update or delete on public.coach_memories for each row execute function private.invalidate_coach_understanding();
revoke all on function private.invalidate_coach_understanding() from public, anon, authenticated;

-- Serialize lifecycle changes with accepting turns and applying coach actions.
create function public.manage_coach_entity(p_owner uuid,p_kind text,p_id uuid,p_version integer,p_patch jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
declare current_version integer; is_home boolean := false;
begin
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(p_owner));
  if p_kind='topic' then
    select version,is_default into current_version,is_home from public.coach_topics where id=p_id and owner_id=p_owner for update;
    if not found then raise exception 'topic_not_found'; end if;
  elsif p_kind='thread' then
    select version into current_version from public.coach_threads where id=p_id and owner_id=p_owner for update;
    if not found then raise exception 'thread_not_found'; end if;
  else raise exception 'capability_unavailable';
  end if;
  if current_version<>p_version then raise exception 'conversation_conflict'; end if;
  if is_home and (p_patch is null or coalesce((p_patch->>'archived')::boolean,false)) then raise exception 'default_topic'; end if;
  if p_kind='topic' then
    if p_patch is null then delete from public.coach_topics where id=p_id;
    else update public.coach_topics set
      title=coalesce(p_patch->>'title',title),
      intention=coalesce(p_patch->>'intention',intention),
      summary=case when p_patch ? 'intention' and p_patch->>'intention'<>intention then '' else summary end,
      archived_at=case when p_patch ? 'archived' then case when (p_patch->>'archived')::boolean then now() else null end else archived_at end,
      version=version+1,updated_at=now() where id=p_id;
    end if;
  else
    if p_patch is null then delete from public.coach_threads where id=p_id;
    else update public.coach_threads set
      title=coalesce(p_patch->>'title',title),
      archived_at=case when p_patch ? 'archived' then case when (p_patch->>'archived')::boolean then now() else null end else archived_at end,
      version=version+1,updated_at=now() where id=p_id;
    end if;
  end if;
end $$;
revoke all on function public.manage_coach_entity(uuid,text,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.manage_coach_entity(uuid,text,uuid,integer,jsonb) to service_role;

create function public.create_coach_topic(p_owner uuid,p_title text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare topic public.coach_topics; thread public.coach_threads;
begin
  insert into public.coach_topics(owner_id,title) values(p_owner,p_title) returning * into topic;
  insert into public.coach_threads(owner_id,topic_id,title) values(p_owner,topic.id,'Conversation') returning * into thread;
  return jsonb_build_object('topic',to_jsonb(topic),'thread',to_jsonb(thread));
end $$;
revoke all on function public.create_coach_topic(uuid,text) from public,anon,authenticated;
grant execute on function public.create_coach_topic(uuid,text) to service_role;
