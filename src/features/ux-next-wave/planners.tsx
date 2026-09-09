import type { Concept } from "./model";
import type { Study } from "./use-study";
import { Prism } from "./planners/prism";
import { Tempo } from "./planners/tempo";
import { Weave } from "./planners/weave";
import { Mosaic } from "./planners/mosaic";
import { Script } from "./planners/script";

export function Planner({ concept, s }: { concept: Concept; s: Study }) {
  switch (concept) {
    case "prism":
      return <Prism s={s} />;
    case "tempo":
      return <Tempo s={s} />;
    case "weave":
      return <Weave s={s} />;
    case "mosaic":
      return <Mosaic s={s} />;
    case "script":
      return <Script s={s} />;
  }
}
