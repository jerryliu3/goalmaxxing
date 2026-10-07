begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(5);

delete from public.grow_score_standings;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('7d111111-1111-4111-8111-111111111111', 'rank-top@example.com', '{"username":"rank_top"}'::jsonb),
  ('7d222222-2222-4222-8222-222222222222', 'rank-mid@example.com', '{"username":"rank_mid"}'::jsonb),
  ('7d333333-3333-4333-8333-333333333333', 'rank-idle@example.com', '{"username":"rank_idle"}'::jsonb),
  ('7d444444-4444-4444-8444-444444444444', 'rank-bot@example.com', '{"username":"rank_bot"}'::jsonb)
on conflict (id) do nothing;

insert into public.synthetic_users (user_id, persona, daily_budget)
values ('7d444444-4444-4444-8444-444444444444', 'high', 5)
on conflict (user_id) do nothing;

insert into public.grow_score_standings (user_id, score, as_of_date)
values
  ('7d111111-1111-4111-8111-111111111111', 90, current_date),
  ('7d222222-2222-4222-8222-222222222222', 40, current_date),
  ('7d444444-4444-4444-8444-444444444444', 500, current_date);

select is(
  (select total from public.grow_score_rank('7d222222-2222-4222-8222-222222222222', 40)),
  (select count(*)::integer from public.profiles p
   where not exists (select 1 from public.synthetic_users s where s.user_id = p.id)),
  'every real account counts in the denominator, synthetic ones never do'
);

select is(
  (select rank from public.grow_score_rank('7d222222-2222-4222-8222-222222222222', 40)),
  2,
  'only higher real scores rank above; the synthetic 500 is ignored'
);

select is(
  (select rank from public.grow_score_rank('7d222222-2222-4222-8222-222222222222', 95)),
  1,
  'a live score is compared without the subject''s own stored row'
);

select is(
  (select rank from public.grow_score_rank('7d333333-3333-4333-8333-333333333333', 0)),
  3,
  'accounts without a snapshot rank as score 0'
);

set local role authenticated;
select throws_ok(
  $$select * from public.grow_score_rank('7d222222-2222-4222-8222-222222222222', 40)$$,
  '42501',
  null,
  'only the service role can rank scores'
);
reset role;

select * from finish();
rollback;
