-- Recurring period goals now use an explicit target of one when no target was
-- supplied. Backfill legacy rows before the edit form sends the normalized
-- value to the immutable update_goal boundary.
update public.goals
set target_count = 1
where frequency_type = 'recurring'::public.goal_frequency_type
  and target_basis = 'period'::public.goal_target_basis
  and target_count is null;
