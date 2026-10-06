-- Finance returns as a preset goal category; it was folded into Other when the
-- category taxonomy launched.
insert into public.goal_categories (key, label, aliases, color, sort_order)
values ('finance', 'Finance', '{}'::text[], '#d97706', 50)
on conflict (key) do update
set label = excluded.label,
    color = excluded.color,
    sort_order = excluded.sort_order,
    updated_at = now();

-- Goals whose custom label already names finance move onto the preset with its
-- canonical label. XP is keyed by category, so each moved goal's owners are
-- recomputed, as update_goal does when a category changes.
do $$
declare
  v_goal_id uuid;
begin
  for v_goal_id in
    update public.goals
    set category_key = 'finance',
        category = 'Finance'
    where category_key = 'other'
      and lower(btrim(category)) in ('finance', 'finances')
    returning id
  loop
    perform private.recompute_xp_for_goal_users(v_goal_id);
  end loop;
end
$$;
