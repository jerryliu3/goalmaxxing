import { Button } from "@/components/ui/button";
import { CoachActionCard } from "./coach-action-card";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";
export function CoachChanges() {
  const coach = useCoach()!;
  const history = coach.history;
  return <div className={s.contentView}><p className={s.eyebrow}>Changes across your rooms</p><h2>A clear record.</h2><p className={s.intro}>What was proposed, what you applied, and what you left as it was.</p>
    {history.actions.map(action => <div key={action.id} className={s.historyItem}><p className={s.eyebrow}>{coach.bootstrap?.topics.find(topic => topic.id === coach.bootstrap?.threads.find(thread => thread.id === action.thread_id)?.topic_id)?.title ?? "Your coach"} · {new Date(action.created_at).toLocaleDateString()}</p><CoachActionCard action={action} /></div>)}
    {!history.actions.length && !history.loading && !history.error && <p className={s.help}>Nothing changed yet. Ask your coach to help adjust your plan.</p>}
    {history.loading && <p role="status" className={s.help}>Reading your changes…</p>}
    {history.error && <p role="alert" className={s.help}>{history.error}</p>}
    <div className={s.buttons}><Button size="sm" variant="ghost" disabled={history.loading} onClick={() => void history.reload()}>Refresh history</Button>{history.next && <Button size="sm" variant="outline" disabled={history.loading} onClick={() => void history.more()}>Earlier changes</Button>}</div>
  </div>;
}
