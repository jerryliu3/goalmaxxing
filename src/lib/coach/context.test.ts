import { describe,expect,it,vi } from 'vitest';
vi.mock('@/lib/coach/api',()=>({coachDatabaseError:vi.fn()}));
import { coachSelectedWindow, coachWindowCounts } from './context';
import { coachSurfaceForPath,COACH_SURFACE_PURPOSE } from './surface-registry';
describe('coach context facts',()=>{
  it('uses the selected calendar year for progress history', () => {
    expect(coachSelectedWindow({surface:'progress',view:'year',selectedDate:'2025-06-01',scope:'self',hasDraft:false},'2026-10-02',1)).toEqual({start:'2025-01-01',end:'2025-12-31'});
  });
  it('keeps off-plan completions separate from scheduled completion rates',()=>{
    const result=coachWindowCounts([{goalId:'g',title:'Writing',scheduledDate:'2026-09-28',credited:true}],[{goalId:'g',completedOn:'2026-09-28'},{goalId:'other',completedOn:'2026-09-28'}],'2026-09-28','2026-10-04');
    expect(result).toEqual({scheduled:1,completed:1,allCompletions:2});
  });
  it('resolves the actual visible month even when the selected day is this week', () => {
    expect(coachSelectedWindow({surface:'plan',view:'month',selectedDate:'2026-10-02',scope:'self',hasDraft:false},'2026-10-02',1)).toEqual({start:'2026-10-01',end:'2026-10-31'});
  });
  it('resolves day and three-day windows across month boundaries', () => {
    const page = {surface:'plan' as const,selectedDate:'2026-10-31',scope:'self' as const,hasDraft:false};
    expect(coachSelectedWindow({...page,view:'day'},'2026-10-02',1)).toEqual({start:'2026-10-31',end:'2026-10-31'});
    expect(coachSelectedWindow({...page,view:'three_day'},'2026-10-02',1)).toEqual({start:'2026-10-31',end:'2026-11-02'});
  });
  it('uses a fixed application-owned purpose for each surface',()=>{
    expect(coachSurfaceForPath('/insights')).toBe('progress');
    expect(COACH_SURFACE_PURPOSE.progress).toContain('recorded completions');
  });
});
