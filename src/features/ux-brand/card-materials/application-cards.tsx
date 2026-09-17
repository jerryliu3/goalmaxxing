import type { ReactNode } from "react";
import { ArrowUpRight, Compass, Sunrise, Sparkles } from "lucide-react";
import type { CardMaterial } from "./materials";
import { MaterialStage } from "./material-stage";
import styles from "./application-cards.module.css";

function Horizon({ portrait = false }: { portrait?: boolean }) {
  return <svg className={styles.horizon} viewBox="0 0 280 190" fill="none" aria-hidden="true">
    <circle cx="140" cy="91" r="65" stroke="currentColor" strokeWidth=".6" />
    <circle cx="140" cy="91" r="53" stroke="currentColor" strokeWidth=".6" strokeDasharray="1 5" />
    <circle cx="140" cy="91" r="36" fill="currentColor" opacity=".07" />
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M0 ${139 + i * 7} Q70 ${92 + i * 9} 140 ${136 + i * 6} T280 ${120 + i * 9}`} stroke="currentColor" opacity={.15 + i * .055} strokeWidth=".7" />)}
    {portrait ? <text x="140" y="105" textAnchor="middle" fill="currentColor" className={styles.monogram}>am</text> : <><path d="M140 5V16M63 37L72 46M208 46L217 37M41 91H52M228 91H239" stroke="currentColor" /><path d="M114 124V92a26 26 0 0 1 52 0v32" stroke="currentColor" /></>}
  </svg>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div><strong data-relief-text>{value}</strong><span>{label}</span></div>;
}

function ChallengeCard() {
  return <article className={`tempo-card ${styles.face}`} aria-label="Sunrise club challenge preview">
    <div className={styles.micro}><span>CHALLENGE / 009</span><Sunrise size={18} strokeWidth={1.2} /></div>
    <Horizon />
    <div className={styles.titleBlock}><span className={styles.kicker}>A little earlier. A little further.</span><h2>Sunrise club</h2><p>Thirty mornings. Move before 8am.<br />Make room for a brighter start.</p></div>
    <div className={styles.challengeCount}><div className="tempo-card-target"><strong>18</strong></div><span>of 30 mornings<br /><b>12 still to come</b></span></div>
    <div className={styles.progress} role="progressbar" aria-label="Challenge mornings completed" aria-valuenow={18} aria-valuemin={0} aria-valuemax={30}><i style={{ width: "60%" }} /></div>
    <div className={styles.micro}><span>SEPT 01 — 30</span><span>1,284 TOGETHER</span></div>
  </article>;
}

const LEADERS = [{ name: "Maya K.", initials: "MK", points: 980 }, { name: "Jordan L.", initials: "JL", points: 920 }, { name: "You", initials: "AM", points: 875 }];
function LeaderboardCard() {
  return <article className={`tempo-card ${styles.face}`} aria-label="Trailblazers leaderboard preview">
    <div className={styles.micro}><span>SEPTEMBER / LEAGUE</span><Compass size={18} strokeWidth={1.2} /></div>
    <div className={styles.titleBlock}><span className={styles.kicker}>The company you keep</span><h2>Trailblazers</h2></div>
    <div className={styles.rank}><div className="tempo-card-target"><strong>03</strong></div><span>YOUR PLACE<small>Among 24 trailblazers</small></span></div>
    <ol className={styles.standings}>{LEADERS.map((person, index) => <li key={person.name} data-self={index === 2}>
      <span className={styles.place}>{String(index + 1).padStart(2, "0")}</span><span className={styles.avatar}>{person.initials}</span><span>{person.name}</span><b>{person.points}</b>
    </li>)}</ol>
    <p className={styles.note}><ArrowUpRight size={16} />{LEADERS[1].points - LEADERS[2].points} points to second place</p>
    <div className={styles.micro}><span>CONSISTENCY, COLLECTIVELY</span><span>03 / 24</span></div>
  </article>;
}

function ProfileCard() {
  return <article className={`tempo-card ${styles.face}`} aria-label="Alex Morgan profile preview">
    <div className={styles.micro}><span>GOALMAXXING / MEMBER</span><Sparkles size={17} strokeWidth={1.2} /></div>
    <div className={styles.identityArt}><Horizon portrait /><span className={styles.serial}>NO. 00146</span></div>
    <div className={styles.titleBlock}><span className={styles.kicker}>Curiosity. Consistency. Open sky.</span><h2>Alex Morgan</h2><p>Building a life worth showing up for.</p></div>
    <div className={styles.metrics}><Metric value="12" label="goals completed" /><Metric value="84%" label="rhythm" /><Metric value="146" label="active days" /></div>
    <div className={styles.signature}><span data-relief-text>Alex M.</span><span>MEMBER SINCE<br />JANUARY 2026</span></div>
    <div className={styles.micro}><span>FIRST 100 · HIGH POINT</span><span>LEVEL 18</span></div>
  </article>;
}

function TeamCard() {
  return <article className={`tempo-card ${styles.face} ${styles.teamFace}`} aria-label="Early Hours team membership preview">
    <div className={styles.micro}><span>GOALMAXXING / TEAM MEMBERSHIP</span><span>EST. 2026</span></div>
    <div className={styles.teamBody}>
      <div className={styles.teamSeal} aria-hidden="true"><Sunrise size={52} strokeWidth={.85} /><span>EARLY HOURS</span><i>EH</i><span>SHOW UP TOGETHER</span></div>
      <div className={styles.teamIdentity}><span className={styles.kicker}>Good mornings start with good company.</span><h2>The Early<br />Hours Club</h2><p>Four people. One shared promise.<br />A little movement before the world wakes.</p>
        <div className={styles.roster} aria-label="Members: Alex, Maya, Jordan, Sam">{["AM", "MK", "JL", "SR"].map(initials => <span className={styles.avatar} key={initials}>{initials}</span>)}<span>4 / 6 members</span></div>
      </div>
      <div className={styles.teamRecord}><span className={styles.kicker}>THIS WEEK</span><strong data-relief-text="display">18<span>/24</span></strong><span>shared sessions</span><div className={styles.progress} role="progressbar" aria-label="Team weekly sessions" aria-valuenow={18} aria-valuemin={0} aria-valuemax={24}><i style={{ width: "75%" }} /></div><p>6 more small steps<br />to a shared finish.</p></div>
    </div>
    <div className={styles.teamFooter}><span>FOCUS<br /><b>Movement & wellbeing</b></span><span>RITUAL<br /><b>Before 8am · Mon–Sat</b></span><span>MEMBERSHIP<br /><b>EH — 0004</b></span></div>
  </article>;
}

const CARDS: { label: string; title: string; detail: string; wide?: boolean; content: ReactNode }[] = [
  { label: "Challenge card", title: "A shared beginning", detail: "A sunrise engraving, a generous counter, and one clear measure of progress.", content: <ChallengeCard /> },
  { label: "Leaderboard card", title: "In good company", detail: "Your place gets the spotlight. The people beside you remain easy to read.", content: <LeaderboardCard /> },
  { label: "Profile trading card", title: "A personal edition", detail: "A monogram, a signature, and a small collection of milestones. An identity to keep.", content: <ProfileCard /> },
  { label: "Team membership card", title: "A place in the club", detail: "A wider membership format gives the team, its ritual, and its shared progress room to breathe.", wide: true, content: <TeamCard /> },
];

export function ApplicationCards({ material, still, color }: { material: CardMaterial; still: boolean; color: string }) {
  return <div className={styles.grid}>{CARDS.map(card => <section key={card.label} className={card.wide ? styles.wide : styles.item} aria-label={card.label}>
    <header className={styles.caption}><span>{card.label}</span><h3>{card.title}</h3><p>{card.detail}</p></header>
    <MaterialStage material={material} color={color} still={still} label={card.label} layout={card.wide ? "landscape" : "portrait"}>{card.content}</MaterialStage>
  </section>)}</div>;
}
