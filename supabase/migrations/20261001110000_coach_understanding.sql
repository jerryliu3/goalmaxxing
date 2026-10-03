alter table public.coach_topics add column summary_sources uuid[] not null default '{}';
alter table public.coach_topics add column summary_updated_at timestamptz;
create table public.coach_forgotten_sources (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null, primary key(owner_id,message_id),
  foreign key(message_id,owner_id) references public.coach_messages(id,owner_id) on delete cascade
);
alter table public.coach_forgotten_sources enable row level security;
revoke all on public.coach_forgotten_sources from public,anon,authenticated;
grant select on public.coach_forgotten_sources to authenticated;
grant all on public.coach_forgotten_sources to service_role;
create policy owner_read on public.coach_forgotten_sources for select to authenticated using(owner_id=(select auth.uid()));

-- Confirmed memories survive deletion of their optional source transcript.
alter table public.coach_memories drop constraint coach_memories_source_message_id_owner_id_fkey;
alter table public.coach_memories add constraint coach_memories_source_message_id_owner_id_fkey
  foreign key(source_message_id,owner_id) references public.coach_messages(id,owner_id) on delete set null (source_message_id);

create or replace function private.invalidate_coach_understanding() returns trigger
language plpgsql security definer set search_path='' as $$
declare affected_owner uuid; affected_topic uuid;
begin
  if tg_table_name='coach_threads' then
    affected_owner:=old.owner_id; affected_topic:=old.topic_id;
  else
    if tg_op='UPDATE' and new.content=old.content and new.kind=old.kind and new.topic_id is not distinct from old.topic_id then return new; end if;
    if tg_op='INSERT' then affected_owner:=new.owner_id; affected_topic:=new.topic_id;
    else
      affected_owner:=old.owner_id; affected_topic:=old.topic_id;
      if old.source_message_id is not null
        and exists(select 1 from public.profiles where id=old.owner_id)
        and exists(select 1 from public.coach_messages where id=old.source_message_id and owner_id=old.owner_id) then
        insert into public.coach_forgotten_sources(owner_id,message_id) values(old.owner_id,old.source_message_id) on conflict do nothing;
      end if;
    end if;
  end if;
  update public.coach_topics set summary='',summary_sources='{}',summary_updated_at=null,version=version+1
    where owner_id=affected_owner and (affected_topic is null or id=affected_topic);
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
drop trigger coach_memory_changed on public.coach_memories;
create trigger coach_memory_changed before insert or update or delete on public.coach_memories for each row execute function private.invalidate_coach_understanding();

create function private.invalidate_coach_topic_intention() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.intention is distinct from old.intention then
    new.summary:=''; new.summary_sources:='{}'; new.summary_updated_at:=null;
  end if;
  return new;
end $$;
create trigger coach_topic_intention_changed before update on public.coach_topics for each row execute function private.invalidate_coach_topic_intention();
revoke all on function private.invalidate_coach_topic_intention() from public,anon,authenticated;

-- Summary updates are sourced and fenced against edits, forgetting, or newer replies.
create function public.save_coach_summary(p_owner uuid,p_topic uuid,p_version integer,p_summary text,p_sources uuid[])
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if char_length(p_summary)>4000 or cardinality(p_sources)>100 then raise exception 'summary_invalid'; end if;
  if exists(select 1 from unnest(p_sources) s where not exists(select 1 from public.coach_messages m join public.coach_threads t on t.id=m.thread_id where m.id=s and m.owner_id=p_owner and m.role='user' and t.topic_id=p_topic) or exists(select 1 from public.coach_forgotten_sources where owner_id=p_owner and message_id=s)) then return false; end if;
  update public.coach_topics set summary=p_summary,summary_sources=p_sources,summary_updated_at=now(),version=version+1 where id=p_topic and owner_id=p_owner and version=p_version and archived_at is null;
  return found;
end $$;
revoke all on function public.save_coach_summary(uuid,uuid,integer,text,uuid[]) from public,anon,authenticated;
grant execute on function public.save_coach_summary(uuid,uuid,integer,text,uuid[]) to service_role;

create function private.check_coach_topic_goal_owner() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.goals where id=new.goal_id and owner_id=new.owner_id and is_deleted=false) then raise exception using errcode='42501',message='goal_not_owned'; end if;
  return new;
end $$;
create trigger coach_topic_goal_owner before insert or update on public.coach_topic_goals for each row execute function private.check_coach_topic_goal_owner();
revoke all on function private.check_coach_topic_goal_owner() from public,anon,authenticated;

create function private.invalidate_coach_topic_goals() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.coach_topics set summary='',summary_sources='{}',summary_updated_at=null,version=version+1
    where id=coalesce(new.topic_id,old.topic_id) and owner_id=coalesce(new.owner_id,old.owner_id);
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger coach_topic_goals_changed after insert or update or delete on public.coach_topic_goals for each row execute function private.invalidate_coach_topic_goals();
revoke all on function private.invalidate_coach_topic_goals() from public,anon,authenticated;
