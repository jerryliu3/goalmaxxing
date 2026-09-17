import { useId, type ReactNode } from "react";
import styles from "./reward-showcase.module.css";

export type RewardShape = "chalice" | "medal" | "summit" | "compass";
type Paint = (name: string) => string;

/** Shared metal, edge, cavity and optical coatings; every sculpture has unique SVG IDs. */
function Sculpture({ label, children }: { label: string; children: (paint: Paint, id: string) => ReactNode }) {
  const id = useId().replace(/:/g, "");
  const paint: Paint = name => `url(#${id}-${name})`;
  return <svg className={styles.sculpture} viewBox="0 0 400 430" role="img" aria-label={label}>
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".15" gradientUnits="objectBoundingBox">
        <stop stopColor="var(--metal-dark)" /><stop offset=".17" stopColor="var(--metal-mid)" /><stop offset=".32" stopColor="var(--metal-light)" /><stop offset=".46" stopColor="var(--metal-mid)" /><stop offset=".7" stopColor="var(--metal-dark)" /><stop offset=".9" stopColor="var(--metal-mid)" /><stop offset="1" stopColor="var(--metal-light)" />
      </linearGradient>
      <linearGradient id={`${id}-edge`} x2=".8" y2="1"><stop stopColor="var(--metal-light)" /><stop offset=".4" stopColor="var(--metal-mid)" /><stop offset=".6" stopColor="var(--metal-dark)" /><stop offset="1" stopColor="var(--metal-light)" /></linearGradient>
      <linearGradient id={`${id}-cavity`} x2="0" y2="1"><stop stopColor="var(--metal-dark)" /><stop offset=".6" stopColor="var(--metal-mid)" /><stop offset="1" stopColor="var(--metal-light)" /></linearGradient>
      <linearGradient id={`${id}-stone`} x2="1" y2=".3"><stop stopColor="#17211f" /><stop offset=".4" stopColor="#3b4440" /><stop offset="1" stopColor="#101916" /></linearGradient>
      <linearGradient id={`${id}-ribbon`} x2="1" y2="0"><stop stopColor="var(--ribbon-dark)" /><stop offset=".3" stopColor="var(--ribbon)" /><stop offset=".5" stopColor="var(--ribbon-light)" /><stop offset=".72" stopColor="var(--ribbon)" /><stop offset="1" stopColor="var(--ribbon-dark)" /></linearGradient>
      <linearGradient id={`${id}-sheen`}><stop stopColor="var(--pearl-a)" stopOpacity="0" /><stop offset=".25" stopColor="var(--pearl-a)" stopOpacity=".25" /><stop offset=".48" stopColor="var(--metal-light)" stopOpacity=".65" /><stop offset=".65" stopColor="var(--pearl-b)" stopOpacity=".3" /><stop offset="1" stopColor="var(--pearl-b)" stopOpacity="0" /></linearGradient>
      <radialGradient id={`${id}-enamel`} cx=".3" cy=".2" r=".9"><stop stopColor="var(--enamel-light)" /><stop offset=".65" stopColor="var(--enamel)" /><stop offset="1" stopColor="var(--metal-dark)" /></radialGradient>
      <radialGradient id={`${id}-shadow`}><stop stopColor="#101914" stopOpacity=".27" /><stop offset="1" stopColor="#101914" stopOpacity="0" /></radialGradient>
      <pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0H4M0 2H4" stroke="#fff" strokeOpacity=".12" strokeWidth=".6" /></pattern>
    </defs>
    <ellipse cx="200" cy="390" rx="152" ry="25" fill={paint("shadow")} />
    {children(paint, id)}
  </svg>;
}

function Sheen({ paint, clip }: { paint: Paint; clip: string }) {
  return <g clipPath={clip}><rect className={styles.reflection} x="20" y="20" width="280" height="380" fill={paint("sheen")} /></g>;
}

function Plinth({ paint, title, subtitle }: { paint: Paint; title: string; subtitle: string }) {
  return <g>
    <path d="M119 327L143 313H263L284 327V375L263 388H119Z" fill={paint("stone")} />
    <path d="M119 327L143 313H263L284 327H119Z" fill="#56605a" />
    <path d="M263 340L284 327V375L263 388Z" fill="#111915" />
    <path d="M119 327H263V388H119Z" fill={paint("stone")} stroke="#748078" strokeWidth=".5" />
    <rect x="132" y="340" width="117" height="32" rx="2" fill={paint("metal")} stroke="var(--metal-light)" strokeWidth=".6" />
    <g fill="var(--engraving)" textAnchor="middle"><text x="190" y="354" className={styles.plaque} data-relief-text>{title}</text><text x="190" y="365" className={styles.edition}>{subtitle}</text></g>
    <circle cx="137" cy="356" r="1" fill="var(--metal-dark)" /><circle cx="244" cy="356" r="1" fill="var(--metal-dark)" />
  </g>;
}

function Chalice() {
  return <Sculpture label="Fluted metal chalice with open handles, a hollow bowl and an engraved stone pedestal">{(p, id) => <>
    <defs><clipPath id={`${id}-cup`}><path d="M122 110H278C274 177 261 218 214 234H186C139 218 126 177 122 110Z" /></clipPath></defs>
    <path d="M128 126C44 98 55 204 151 208M272 126C356 98 345 204 249 208" fill="none" stroke={p("metal")} strokeWidth="14" />
    <path d="M126 126C48 106 67 195 147 202M274 126C352 106 333 195 253 202" fill="none" stroke="var(--metal-light)" strokeWidth="1.6" opacity=".8" />
    <Plinth paint={p} title="A YEAR IN MOTION" subtitle="TWELVE MONTHS · 2026" />
    <ellipse cx="200" cy="313" rx="46" ry="10" fill={p("edge")} />
    <path d="M163 310Q191 296 190 270V227H210V270Q209 296 237 310Z" fill={p("metal")} />
    <ellipse cx="200" cy="234" rx="20" ry="5" fill={p("edge")} />
    <path d="M122 110H278C274 177 261 218 214 234H186C139 218 126 177 122 110Z" fill={p("metal")} stroke="var(--metal-mid)" />
    <g clipPath={`url(#${id}-cup)`}>{Array.from({ length: 15 }, (_, i) => <path key={i} d={`M${122 + i * 11} 115 Q${135 + i * 9} 190 ${187 + i * 1.8} 234`} fill="none" stroke={i % 2 ? "var(--metal-dark)" : "var(--metal-light)"} opacity=".18" strokeWidth="1.6" />)}</g>
    <Sheen paint={p} clip={`url(#${id}-cup)`} />
    <ellipse cx="200" cy="110" rx="78" ry="17" fill={p("edge")} stroke="var(--metal-light)" />
    <ellipse cx="200" cy="109" rx="71" ry="12" fill={p("cavity")} />
    <path d="M137 109Q200 92 263 109" fill="none" stroke="var(--metal-dark)" opacity=".5" />
    <g fill="var(--engraving)" textAnchor="middle"><text x="200" y="185" className={styles.heroNumber} data-relief-text>12</text><text x="200" y="204" className={styles.smallType}>MONTHS OF MOMENTUM</text></g>
  </>}</Sculpture>;
}

function Medal() {
  return <Sculpture label="Machined milestone medallion with a woven ribbon, reeded rim and stamped 100">{(p, id) => <>
    <defs><clipPath id={`${id}-disc`}><circle cx="200" cy="260" r="98" /></clipPath></defs>
    <path d="M106 34L154 28L214 162L183 193Z" fill={p("ribbon")} /><path d="M244 28L294 34L219 193L188 162Z" fill={p("ribbon")} />
    <path d="M106 34L154 28L214 162L183 193ZM244 28L294 34L219 193L188 162Z" fill={p("weave")} />
    <path d="M115 33L185 179M145 30L205 163M254 30L194 165M284 33L216 179" stroke="var(--metal-light)" strokeWidth="1.5" opacity=".7" />
    <ellipse cx="200" cy="166" rx="18" ry="21" fill="none" stroke={p("metal")} strokeWidth="8" />
    <circle cx="203" cy="270" r="104" fill={p("edge")} />
    <circle cx="200" cy="260" r="104" fill={p("metal")} stroke="var(--metal-dark)" />
    {Array.from({ length: 80 }, (_, i) => <path key={i} d="M200 158V164" transform={`rotate(${i * 4.5} 200 260)`} stroke={i % 2 ? "var(--metal-dark)" : "var(--metal-light)"} strokeWidth="1.1" />)}
    <circle cx="200" cy="260" r="94" fill={p("enamel")} stroke="var(--metal-light)" strokeWidth="1.5" />
    <circle cx="200" cy="260" r="83" fill={p("metal")} stroke="var(--metal-dark)" strokeWidth=".7" />
    <circle cx="200" cy="260" r="77" fill="none" stroke="var(--metal-light)" strokeWidth=".6" strokeDasharray="1 4" />
    <Sheen paint={p} clip={`url(#${id}-disc)`} />
    <g fill="var(--engraving)" textAnchor="middle"><text x="200" y="224" className={styles.smallType}>ONE SMALL STEP, AGAIN</text><text x="197" y="281" className={styles.medalNumber} data-relief-text>100</text><text x="200" y="304" className={styles.smallType}>SESSIONS COMPLETED</text><path d="M173 320H191M209 320H227M200 316L204 320L200 324L196 320Z" stroke="currentColor" fill="none" strokeWidth=".7" /></g>
  </>}</Sculpture>;
}

function Summit() {
  return <Sculpture label="Faceted summit obelisk with translucent ridges and a polished stone award base">{(p, id) => <>
    <defs><clipPath id={`${id}-peak`}><path d="M200 42L268 203L260 311H144L134 233Z" /></clipPath></defs>
    <Plinth paint={p} title="YOUR OWN SUMMIT" subtitle="A LONG-TERM GOAL, REALIZED" />
    <path d="M144 305L200 289L260 305L235 321H163Z" fill={p("edge")} stroke="var(--metal-light)" />
    <path d="M200 42L134 233L144 305L194 284Z" fill={p("metal")} />
    <path d="M200 42L268 203L260 305L194 284Z" fill={p("enamel")} />
    <path d="M200 42L213 222L194 284Z" fill="var(--metal-light)" opacity=".5" />
    <path d="M134 233L173 209L194 284L144 305Z" fill={p("cavity")} />
    <path d="M268 203L233 233L194 284L260 305Z" fill={p("edge")} />
    <Sheen paint={p} clip={`url(#${id}-peak)`} />
    <path d="M200 42L194 284L144 305M200 42L268 203L260 305M134 233L173 209L194 284L233 233L268 203" fill="none" stroke="var(--metal-light)" strokeWidth=".9" />
    <path d="M162 217L189 146L185 231M219 183L231 211" fill="none" stroke="var(--metal-light)" opacity=".4" />
    <g transform="translate(205 260) rotate(-15)" fill="var(--metal-light)"><text textAnchor="middle" className={styles.smallType}>ONE GOAL.</text><text y="12" textAnchor="middle" className={styles.smallType}>ALL YOURS.</text></g>
  </>}</Sculpture>;
}

function Compass() {
  return <Sculpture label="Precision momentum compass with a jewel bearing, enamel dial and a beveled metal case">{(p, id) => <>
    <defs><clipPath id={`${id}-dial`}><circle cx="200" cy="226" r="108" /></clipPath></defs>
    <ellipse cx="200" cy="87" rx="21" ry="24" fill="none" stroke={p("metal")} strokeWidth="9" />
    <path d="M190 101H210V122H190Z" fill={p("metal")} />
    <circle cx="205" cy="239" r="119" fill={p("edge")} stroke="var(--metal-dark)" />
    <circle cx="200" cy="226" r="119" fill={p("metal")} stroke="var(--metal-light)" />
    <circle cx="200" cy="226" r="110" fill={p("cavity")} />
    <circle cx="200" cy="226" r="103" fill={p("enamel")} stroke="var(--metal-mid)" />
    <circle cx="200" cy="226" r="89" fill="none" stroke="var(--dial-ink)" opacity=".3" strokeWidth=".6" />
    {Array.from({ length: 60 }, (_, i) => <path key={i} d={`M200 128V${i % 5 === 0 ? 140 : 134}`} transform={`rotate(${i * 6} 200 226)`} stroke="var(--dial-ink)" opacity={i % 5 === 0 ? .8 : .4} strokeWidth={i % 5 === 0 ? 1.3 : .6} />)}
    <g fill="var(--dial-ink)" textAnchor="middle" className={styles.direction}><text x="200" y="159">N</text><text x="274" y="230">E</text><text x="200" y="307">S</text><text x="125" y="230">W</text></g>
    <path d="M146 172L254 280M146 280L254 172" stroke="var(--dial-ink)" strokeWidth=".5" opacity=".2" />
    <g transform="rotate(24 200 226)"><path d="M200 158L183 226L200 294L217 226Z" fill={p("metal")} stroke="var(--metal-light)" strokeWidth=".6" /><path d="M200 158V226H183Z" fill="var(--metal-light)" /><path d="M200 226V294L217 226Z" fill="var(--metal-dark)" /></g>
    <circle cx="200" cy="226" r="10" fill={p("edge")} /><circle cx="200" cy="226" r="4" fill={p("enamel")} stroke="var(--metal-light)" />
    <Sheen paint={p} clip={`url(#${id}-dial)`} />
    <text x="200" y="363" textAnchor="middle" fill="var(--study-ink)" className={styles.compassCaption} data-relief-text>Always, a way forward.</text>
    <text x="200" y="381" textAnchor="middle" fill="var(--study-muted)" className={styles.smallType}>THE ART OF BEGINNING AGAIN</text>
  </>}</Sculpture>;
}

export function RewardSculpture({ shape }: { shape: RewardShape }) {
  switch (shape) {
    case "chalice": return <Chalice />;
    case "medal": return <Medal />;
    case "summit": return <Summit />;
    case "compass": return <Compass />;
  }
}
