import type { ButtonHTMLAttributes } from "react";
import s from "./prototype.module.css";

export function CoachMark({ small = false }: { small?: boolean }) {
  return <span className={`${s.mark} ${small ? s.markSmall : ""}`} aria-hidden="true"><span /><span /><span /></span>;
}
export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" className={s.iconButton} aria-label={label} title={label} {...props}>{children}</button>;
}
