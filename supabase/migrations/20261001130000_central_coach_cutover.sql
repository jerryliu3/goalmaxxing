-- Retire the old writer, reconcile saved history, and remove the replaced storage.
-- Unsaved browser transcripts are never auto-imported. Restore uses backup/PITR.
do $$ begin
lock table public.planner_coach_conversations,public.planner_coach_conversation_messages in access exclusive mode;
revoke insert,update,delete on public.planner_coach_conversations,public.planner_coach_conversation_messages from authenticated,service_role;
drop function if exists public.save_planner_coach_conversation_service(text,text,text,text,jsonb);
drop function if exists public.list_planner_coach_conversations_service(uuid,text,integer);
drop function if exists public.get_planner_coach_conversation_service(uuid,uuid);
insert into public.coach_topics(owner_id,title,is_default)
select distinct owner_id,'My week',true from public.planner_coach_conversations on conflict do nothing;
insert into public.coach_threads(id,owner_id,topic_id,title,version,legacy_conversation_id,created_at,updated_at)
select c.id,c.owner_id,t.id,c.title,c.message_count,c.id,c.created_at,c.updated_at
from public.planner_coach_conversations c join public.coach_topics t on t.owner_id=c.owner_id and t.is_default
on conflict do nothing;
insert into public.coach_messages(owner_id,thread_id,sequence,role,content,source,created_at)
select m.owner_id,m.conversation_id,m.ordinal,m.role,m.content,jsonb_build_object('legacy',true,'scopeMonth',c.scope_month),m.created_at
from public.planner_coach_conversation_messages m join public.planner_coach_conversations c on c.id=m.conversation_id
where not exists(select 1 from public.coach_messages n where n.thread_id=m.conversation_id and n.sequence=m.ordinal)
on conflict(thread_id,sequence) do nothing;
update public.coach_threads t set version=greatest(t.version,(select coalesce(max(sequence),0) from public.coach_messages m where m.thread_id=t.id)) where t.legacy_conversation_id is not null;
-- Refuse cleanup if a saved transcript was not copied exactly.
  if exists (
    select 1 from public.planner_coach_conversation_messages legacy
    where not exists(select 1 from public.coach_messages current where current.thread_id=legacy.conversation_id
      and current.owner_id=legacy.owner_id and current.sequence=legacy.ordinal and current.role=legacy.role and current.content=legacy.content)
  ) then raise exception 'coach_history_backfill_incomplete'; end if;
drop table public.planner_coach_conversation_messages;
drop table public.planner_coach_conversations;
end $$;
