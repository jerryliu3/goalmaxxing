begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(4);

select ok(
  exists(
    select 1
    from public.goal_categories
    where key = 'finance'
      and label = 'Finance'
      and sort_order = 50
  ),
  'finance is a preset category between relationships and other'
);

select is(
  private.normalize_goal_category_key('Finance'),
  'finance',
  'the Finance label resolves to the finance key'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.create_goal(
  'b1400000-0000-4000-8000-0000000000f1',
  'Finance category write-boundary test',
  null,
  null,
  'finance',
  'finance',
  '#d97706',
  'recurring',
  'weekly',
  1,
  null,
  current_date - 7,
  current_date + 7,
  null,
  null
);

select is(
  (
    select category_key
    from public.goals
    where id = 'b1400000-0000-4000-8000-0000000000f1'
  ),
  'finance',
  'create_goal stores the finance key'
);

select is(
  (
    select category
    from public.goals
    where id = 'b1400000-0000-4000-8000-0000000000f1'
  ),
  'Finance',
  'create_goal writes the canonical Finance label'
);

select * from finish();
rollback;
