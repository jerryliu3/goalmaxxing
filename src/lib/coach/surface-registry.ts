import type { CoachPage } from "@cadence/shared/coach";
export const COACH_SURFACE_PURPOSE: Record<CoachPage["surface"],string> = {
  plan:"Place and adjust scheduled work. Selected dates are view context, not the current day.",
  checklist:"Do and record work, including work that has not been scheduled.",
  progress:"Understand recorded completions and progress toward goals.",
  community:"View shared activity and relationships; private coaching and mutations remain self-only.",
  you:"Manage personal preferences and account settings.",
  goal:"Create or edit goals, including cadence, targets, dates, and linked goals. Goal changes and schedule placement are separate decisions.",
  coach:"Discuss ongoing topics, inspect understanding, and review actions.",
};
export function coachSurfaceForPath(path:string):CoachPage["surface"] {
  if(path.startsWith('/goals')) return 'goal';
  if(path.startsWith('/coach')) return 'coach';
  if(path.startsWith('/today')||path.startsWith('/checklist')||path.startsWith('/tasks')) return 'checklist';
  if(path.startsWith('/insights')||path.startsWith('/progress')) return 'progress';
  if(path.startsWith('/social')||path.startsWith('/community')) return 'community';
  if(path.startsWith('/settings')||path.startsWith('/you')) return 'you';
  return 'plan';
}
