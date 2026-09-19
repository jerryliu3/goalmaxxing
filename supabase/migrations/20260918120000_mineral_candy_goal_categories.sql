-- Replace the initial placeholder category palette with the approved Mineral Candy assignments.
-- Keep the relationships key; Interpersonal is a display-label change with a Relationships alias.
insert into public.goal_categories (key, label, aliases, color, sort_order)
values
  ('health', 'Health', '{}'::text[], '#FFA583', 10),
  ('career', 'Career', '{}'::text[], '#AABAFB', 20),
  ('personal', 'Personal', '{}'::text[], '#C4A8F5', 30),
  ('relationships', 'Interpersonal', array['Relationships', 'Relationship']::text[], '#DE93B6', 40),
  ('finance', 'Finances', array['Finance']::text[], '#83D3A3', 50),
  ('other', 'Other', '{}'::text[], '#F4D35E', 999)
on conflict (key) do update
set label = excluded.label,
    aliases = excluded.aliases,
    color = excluded.color,
    sort_order = excluded.sort_order,
    updated_at = now();

update public.goals
set category = 'Interpersonal'
where category_key = 'relationships'
  and category is distinct from 'Interpersonal';

create or replace function private.normalize_goal_category_key(p_category text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  with normalized as (
    select lower(btrim(coalesce(p_category, ''))) as category
  )
  select coalesce(
    (
      select gc.key
      from public.goal_categories gc
      join normalized n on true
      where n.category = lower(gc.key)
         or n.category = lower(gc.label)
         or exists (
           select 1
           from pg_catalog.unnest(gc.aliases) as alias
           where n.category = lower(alias)
         )
      order by gc.sort_order asc, gc.key asc
      limit 1
    ),
    'other'
  );
$$;

alter table public.goal_categories enable row level security;
