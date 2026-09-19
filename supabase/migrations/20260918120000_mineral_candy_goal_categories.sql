-- Replace the initial placeholder category palette with the approved Mineral Candy assignments.
insert into public.goal_categories (key, label, aliases, color, sort_order)
values
  ('health', 'Health', '{}'::text[], '#FFA583', 10),
  ('career', 'Career', '{}'::text[], '#AABAFB', 20),
  ('personal', 'Personal', '{}'::text[], '#C4A8F5', 30),
  ('relationships', 'Relationships', '{}'::text[], '#DE93B6', 40),
  ('finance', 'Finance', '{}'::text[], '#83D3A3', 50),
  ('other', 'Other', '{}'::text[], '#F4D35E', 999)
on conflict (key) do update
set label = excluded.label,
    aliases = excluded.aliases,
    color = excluded.color,
    sort_order = excluded.sort_order,
    updated_at = now();

alter table public.goal_categories enable row level security;
