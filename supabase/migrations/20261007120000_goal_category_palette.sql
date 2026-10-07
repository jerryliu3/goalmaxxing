-- Goal categories adopt the Mineral Candy palette (packages/shared/src/brand/
-- categories.ts), and the relationships category reads as "Interpersonal",
-- keeping "Relationships" as an alias.
insert into public.goal_categories (key, label, aliases, color, sort_order)
values
  ('health', 'Health', '{}'::text[], '#ffa583', 10),
  ('career', 'Career', '{}'::text[], '#aabafb', 20),
  ('personal', 'Personal', '{}'::text[], '#c4a8f5', 30),
  ('relationships', 'Interpersonal', array['Relationships', 'Relationship']::text[], '#de93b6', 40),
  ('finance', 'Finance', '{}'::text[], '#83d3a3', 50),
  ('other', 'Other', '{}'::text[], '#f4d35e', 999)
on conflict (key) do update
set label = excluded.label,
    aliases = excluded.aliases,
    color = excluded.color,
    sort_order = excluded.sort_order,
    updated_at = now();

-- A category resolves from its key, its label, or any alias, so goals and
-- imports that still say "Relationships" land on the same key.
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

-- Every goal in a preset category moves to its category's new color and
-- label. Goals in Other keep their own label and color.
update public.goals g
set color = gc.color,
    category = gc.label
from public.goal_categories gc
where gc.key = g.category_key
  and g.category_key <> 'other'
  and (g.color is distinct from gc.color or g.category is distinct from gc.label);
