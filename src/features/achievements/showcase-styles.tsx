import { GAZETTEER } from "@/lib/brand/gazetteer";

export function AchievementsShowcaseStyles() {
  return (
    <style>{`
      .ach-showcase-root {
        background:
          radial-gradient(ellipse 70% 45% at 50% 0%, rgba(154, 79, 44, 0.28), transparent 52%),
          radial-gradient(ellipse 50% 35% at 90% 20%, rgba(212, 168, 75, 0.12), transparent 45%),
          linear-gradient(180deg, #1a1510 0%, #241c14 42%, #18140f 100%);
      }
      .ach-showcase-glass {
        background: linear-gradient(180deg, #2c241c 0%, #1f1914 100%);
        border: 1px solid #3f3429;
        box-shadow:
          inset 0 1px 0 rgba(248, 241, 227, 0.08),
          inset 0 -24px 48px rgba(0, 0, 0, 0.35);
      }
      .ach-showcase-shelf {
        background: linear-gradient(180deg, #6a5338 0%, #4a3a28 45%, #32281c 100%);
      }
      .ach-showcase-pedestal {
        background:
          radial-gradient(ellipse at 50% 0%, rgba(212, 168, 75, 0.28), transparent 58%),
          linear-gradient(165deg, #3a2f24, #2a221a);
      }
      .ach-showcase-record {
        background:
          radial-gradient(ellipse at 20% 0%, rgba(240, 215, 138, 0.12), transparent 55%),
          linear-gradient(160deg, #3a2f24, #2a221a);
      }
      .ach-showcase-mount {
        background:
          radial-gradient(ellipse at 30% 20%, rgba(240, 215, 138, 0.14), transparent 55%),
          linear-gradient(160deg, #3a2f24, #2a221a);
      }
      .ach-showcase-mount-locked {
        background: linear-gradient(160deg, #1c1712, #14100c);
      }
      .ach-showcase-fill {
        background: linear-gradient(90deg, ${GAZETTEER.stamp}, ${GAZETTEER.stampLight} 55%, #d4a84b);
      }
      @keyframes ach-showcase-rise {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .ach-showcase-hero {
        animation: ach-showcase-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
    `}</style>
  );
}
