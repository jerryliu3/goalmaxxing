import s from "./coach.module.css";
export function CoachMark({ small = false }: { small?: boolean }) {
  // Circle centers form an equilateral triangle; both sizes share this geometry.
  return <span className={`${s.mark} ${small ? s.markSmall : ""}`} aria-hidden="true">
    <svg viewBox="0 0 64 56" fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="24" cy="21" r="18" vectorEffect="non-scaling-stroke" />
      <circle cx="40" cy="21" r="18" vectorEffect="non-scaling-stroke" />
      <circle cx="32" cy="34.85640646" r="18" vectorEffect="non-scaling-stroke" />
    </svg>
  </span>;
}
