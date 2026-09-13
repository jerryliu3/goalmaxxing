import { type Concept, type Draft, rhythm } from "./model";

export function GoalPreview({
  concept,
  draft: d,
}: {
  concept: Concept;
  draft: Draft;
}) {
  return (
    <aside className="j-live-object" aria-label="Live goal preview">
      <span className="j-kicker">
        {concept === "tempo"
          ? "Your commitment, taking shape"
          : concept === "weave"
            ? "The thread you’re building"
            : "A note to your future self"}
      </span>
      {concept === "tempo" ? (
        <>
          <div className="j-big-target">
            {d.kind === "planner_task"
              ? "01"
              : String(d.target_count || "0").padStart(2, "0")}
            <small>
              {d.kind === "fixed_milestones"
                ? "milestones"
                : d.kind === "planner_task"
                  ? "task"
                  : d.target_basis === "lifetime"
                    ? "completions"
                    : "days to show up"}
            </small>
          </div>
          <h3>{d.title || "Something worth starting."}</h3>
          <div className="j-ticket-rule" />
          <p>{rhythm(d)}</p>
          <p>
            {d.end_date
              ? `A horizon: ${d.end_date}`
              : "Room to grow. No end date."}
          </p>
        </>
      ) : concept === "weave" ? (
        <>
          <h3>{d.title || "A new thread in your week."}</h3>
          <div className="j-loom" aria-hidden="true">
            {Array.from({ length: 5 }, (_, row) => (
              <div key={row}>
                {Array.from({ length: 7 }, (_, col) => (
                  <i
                    className={
                      col < Math.min(7, Number(d.target_count || 0))
                        ? "filled"
                        : ""
                    }
                    key={col}
                  />
                ))}
              </div>
            ))}
          </div>
          <p>{rhythm(d)}</p>
          <small>Illustrative pattern; exact days are chosen in Planner.</small>
        </>
      ) : (
        <>
          <span className="j-quote">“</span>
          <p className="j-living-sentence">
            I’m making space for <em>{d.title || "something that matters"}</em>.
            {d.kind === "planner_task"
              ? "I’ll do it once: "
              : "I’ll return to it "}
            <em>{rhythm(d).toLowerCase()}</em>
            {d.kind === "planner_task"
              ? ""
              : d.end_date
                ? `, through ${d.end_date}`
                : ", with room to keep going"}
            .
          </p>
          <span className="j-signature">A promise with room to be human.</span>
        </>
      )}
      <div className="j-live-footer">
        {d.category_selection === "custom"
          ? d.custom_category
          : d.category_selection}{" "}
        · {d.kind === "planner_task" ? "Planner task" : d.difficulty}
        <br />
        {(d.kind === "planner_task"
          ? d.task_scheduled_time
          : d.default_local_time) || "Any time of day"}
      </div>
    </aside>
  );
}
