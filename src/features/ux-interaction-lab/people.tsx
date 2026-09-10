import { useState } from "react";
import { ArrowUpRight, Check, Lock, Users } from "lucide-react";
import { TODAY, periodDays } from "./model";
import type { Lab } from "./use-lab";
export function People({ s }: { s: Lab }) {
  const [section, setSection] = useState("team");
  const [person, setPerson] = useState<string | null>(null);
  const dates = periodDays(TODAY, "week");
  const own = s.data.records.filter(
    (r) =>
      dates.includes(r.date) &&
      r.goalId &&
      s.data.goals.some((g) => g.id === r.goalId && !g.is_private) &&
      r.source === "manual",
  ).length;
  const members = [
    { name: "Alex", initials: "AL", count: 8, color: "#e7c8ae" },
    { name: "Morgan", initials: "MO", count: 6, color: "#c9c4e4" },
    { name: "Sam", initials: "SA", count: 4, color: "#c8d9d0" },
  ];
  const rank = [
    ...members,
    ...(s.data.sharing
      ? [{ name: "You", initials: "YO", count: own, color: "#b8d5e8" }]
      : []),
  ].sort((a, b) => b.count - a.count);
  return (
    <div className="il-people">
      <nav className="il-people-nav" aria-label="Community sections">
        {["team", "challenge", "leaderboard"].map((t) => (
          <button
            key={t}
            aria-pressed={section === t}
            onClick={() => {
              setSection(t);
              setPerson(null);
            }}
          >
            {t === "team"
              ? "Your team"
              : t === "challenge"
                ? "Challenges"
                : "Leaderboard"}
          </button>
        ))}
      </nav>
      <div className="il-people-main">
        <section className="il-club-cover">
          <div className="il-club-mark">
            <Users size={36} />
          </div>
          <span className="il-eyebrow">Small Steps Club</span>
          <h2>
            A little further.
            <br />
            Together.
          </h2>
          <p>
            Different goals.
            <br />A shared reason to keep showing up.
          </p>
          <div className="il-avatar-stack">
            {members.map((m) => (
              <span key={m.name} style={{ background: m.color }}>
                {m.initials}
              </span>
            ))}
          </div>
          <small>Seeded people · no messages are sent</small>
        </section>
        <section className="il-club-content">
          {section === "team" ? (
            <>
              <div className="il-section-heading">
                <h2>Your people</h2>
                <span className="il-count">This week</span>
              </div>
              {members.map((m) => (
                <button
                  key={m.name}
                  className="il-person-row"
                  onClick={() => setPerson(person === m.name ? null : m.name)}
                  aria-expanded={person === m.name}
                >
                  <span className="il-avatar" style={{ background: m.color }}>
                    {m.initials}
                  </span>
                  <span>
                    <strong>{m.name}</strong>
                    <small>{m.count} shared completions</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
              {person && (
                <div className="il-record-detail">
                  <h3>{person}’s shared summary</h3>
                  <p>
                    Building a steady rhythm with the club. Only shared totals
                    are shown here; private goals and calendars stay private.
                  </p>
                </div>
              )}
              <div className="il-team-goal">
                <span className="il-eyebrow">Team goal</span>
                <h3>Strength</h3>
                <p>Make room for 3 completions each week.</p>
                <button
                  className="il-text-button"
                  onClick={() => {
                    s.setActiveGoal("g1");
                    s.clearFilters();
                    s.setDestination("goals");
                  }}
                >
                  Open team goal <ArrowUpRight size={15} />
                </button>
              </div>
            </>
          ) : section === "challenge" ? (
            <>
              <span className="il-eyebrow">
                7–13 September · Optional challenge
              </span>
              <h2>Three small wins.</h2>
              <p>
                Complete any three occurrences of your non-private goals this
                week. Private goals and one-time tasks do not count.
              </p>
              <div
                className="il-challenge-stamps"
                aria-label={`${Math.min(3, own)} of 3 eligible completions`}
              >
                {[0, 1, 2].map((n) => (
                  <span key={n}>{own > n ? <Check size={30} /> : n + 1}</span>
                ))}
              </div>
              <p>
                {s.data.joined
                  ? `${Math.min(3, own)} of 3 · You’re in. Earlier eligible completions this week also count.`
                  : "Preview the rules, then decide if it suits your week."}
              </p>
              <button
                className={s.data.joined ? "il-secondary" : "il-primary"}
                onClick={() =>
                  s.commit(
                    { ...s.data, joined: !s.data.joined },
                    s.data.joined
                      ? "Left the demo challenge"
                      : "Joined the demo challenge · No real membership changed",
                  )
                }
              >
                {s.data.joined ? "Leave challenge" : "Join in demo"}
              </button>
            </>
          ) : (
            <>
              <div className="il-section-heading">
                <h2>This week’s effort</h2>
                <span className="il-count">Shared completions</span>
              </div>
              <ol className="il-leaderboard">
                {rank.map((m, i) => (
                  <li key={m.name}>
                    <span>{i + 1}</span>
                    <span className="il-avatar" style={{ background: m.color }}>
                      {m.initials}
                    </span>
                    <strong>{m.name}</strong>
                    <span>{m.count}</span>
                  </li>
                ))}
              </ol>
              {!s.data.sharing && (
                <p>
                  You’re viewing privately. Enable the demo sharing setting
                  below to include your eligible total.
                </p>
              )}
            </>
          )}
          <label className="il-sharing">
            <input
              type="checkbox"
              checked={s.data.sharing}
              onChange={(e) =>
                s.commit(
                  { ...s.data, sharing: e.target.checked },
                  e.target.checked
                    ? "Your eligible total is visible in the demo leaderboard"
                    : "Your total is private again",
                )
              }
            />
            <span>
              Include my public-goal total
              <small>
                <Lock size={12} />
                Private goals always stay excluded.
              </small>
            </span>
          </label>
        </section>
      </div>
    </div>
  );
}
