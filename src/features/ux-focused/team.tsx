import { ProductHeader } from "./common";
import { TEAM_GOALS } from "./model";

export function TeamBaseline() {
  return (
    <div className="fc-product">
      <ProductHeader title="Alex Lee" detail="Team" />
      <p className="type-figure">Team XP · 2,400</p>
      <section className="fc-section">
        <h3 className="type-heading">Shared week</h3>
        <div className="fc-week fc-baseline-week">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} data-elapsed={i < 3} data-today={i === 3}>
              {day}
            </div>
          ))}
        </div>
        <p className="fc-muted">
          Colored by weekday, without completion counts.
        </p>
      </section>
      <section className="fc-section">
        <h3 className="type-heading">Shared goals</h3>
        {TEAM_GOALS.map((goal) => (
          <div className="fc-line" key={goal.id}>
            <span>{goal.title}</span>
            <span className="fc-muted">Open on Plan ↗</span>
          </div>
        ))}
        <p className="fc-muted">Both links lead to the same week calendar.</p>
      </section>
    </div>
  );
}
