begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(6);

select is(
  (select color from public.goal_categories where key = 'health'),
  '#ffa583',
  'categories use the Mineral Candy palette'
);

select is(
  (select label from public.goal_categories where key = 'relationships'),
  'Interpersonal',
  'relationships displays as Interpersonal'
);

select is(
  private.normalize_goal_category_key('Relationships'),
  'relationships',
  'the old Relationships label still resolves through its alias'
);

select is(
  private.normalize_goal_category_key('interpersonal'),
  'relationships',
  'the Interpersonal label resolves to the relationships key'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.create_goal(
  'b1400000-0000-4000-8000-0000000000c1',
  'Interpersonal category write-boundary test',
  null,
  null,
  'Relationships',
  null,
  '#de93b6',
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
    where id = 'b1400000-0000-4000-8000-0000000000c1'
  ),
  'relationships',
  'create_goal maps a Relationships label onto the relationships key'
);

select is(
  (
    select category
    from public.goals
    where id = 'b1400000-0000-4000-8000-0000000000c1'
  ),
  'Interpersonal',
  'create_goal stores the canonical Interpersonal label'
);

select * from finish();
rollback;
