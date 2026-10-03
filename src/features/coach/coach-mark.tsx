import s from "./coach.module.css";
export function CoachMark({ small = false }: { small?: boolean }) {
  return <span className={`${s.mark} ${small ? s.markSmall : ""}`} aria-hidden="true"><i /><i /><i /></span>;
}
