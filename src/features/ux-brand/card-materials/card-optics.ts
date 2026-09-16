export type CardPose = { x: number; y: number };
export const REST_POSE: CardPose = { x: 7, y: -14 };
export const TILTED_POSE: CardPose = { x: -16, y: 25 };
export const FLAT_POSE: CardPose = { x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function pointerPose(x: number, y: number): CardPose {
  return { x: (0.5 - clamp(y, 0, 1)) * 36, y: (clamp(x, 0, 1) - 0.5) * 52 };
}

/** Drag keeps angles unbounded so repeated turns never jump at +/-180. */
export function dragPose(start: CardPose, dx: number, dy: number): CardPose {
  return { x: start.x - dy * 0.8, y: start.y + dx * 0.8 };
}

/** Return to a familiar view without unwinding every full revolution. */
export function nearestPose(from: CardPose, to: CardPose): CardPose {
  return { x: to.x + Math.round((from.x - to.x) / 360) * 360, y: to.y + Math.round((from.y - to.y) / 360) * 360 };
}

/** Fixed upper-left light, transformed into the rotating card's coordinates.
 * The highlight is a stylized specular lobe, not a refraction simulation. */
export function cardOptics(pose: CardPose): Record<string, string> {
  const x = pose.x * Math.PI / 180;
  const y = pose.y * Math.PI / 180;
  // Inverse of CSS rotateX(x) rotateY(y): Ry(-y) Rx(-x).
  const local = (lx: number, ly: number, lz: number) => {
    const length = Math.hypot(lx, ly, lz);
    const afterX = (Math.cos(x) * ly + Math.sin(x) * lz) / length;
    const afterZ = (-Math.sin(x) * ly + Math.cos(x) * lz) / length;
    return { x: Math.cos(y) * lx / length - Math.sin(y) * afterZ, y: afterX };
  };
  const light = local(-0.45, -0.55, 1);
  const half = local(-0.22, -0.27, 1); // Light/view bisector for the reflection.
  // Raised lettering shows the side facing the viewer, so its body extends away
  // from the viewer across the face. Only a nearly head-on card, which would show
  // no side at all, falls back to a conventional light-opposite emboss.
  const view = local(0, 0, 1);
  const headOn = Math.max(0, 1 - (Math.abs(view.x) + Math.abs(view.y)) * 3);
  const extrude = (v: number, l: number) => clamp(-v * 1.9 - l * 0.5 * headOn, -1.35, 1.35).toFixed(3);
  // The visible wall faces the viewer, so it brightens only while the viewer and
  // the light share a side. A head-on card shows no wall at all, just its shadow.
  const facing = Math.max(Math.hypot(view.x, view.y), 1e-6);
  const wall = (view.x * light.x + view.y * light.y) / facing;
  return {
    "--rx": `${pose.x}deg`, "--ry": `${pose.y}deg`,
    "--light-x": `${50 + light.x * 65}%`, "--light-y": `${50 + light.y * 65}%`,
    "--rim-light-x": String(light.x), "--rim-light-y": String(light.y),
    "--emboss-x": extrude(view.x, light.x), "--emboss-y": extrude(view.y, light.y),
    "--emboss-side-light": ((1 - headOn) * clamp(0.5 + wall * 0.6, 0, 1) + headOn * 0.12).toFixed(3),
    "--shine-position": `${clamp(50 + half.x * 165, -35, 135)}%`,
    "--shine-angle": `${112 + Math.sin(x) * 4 - Math.sin(y) * 2}deg`,
    "--shine-strength": String(0.28 + 0.5 * Math.exp(-5 * (half.x ** 2 + half.y ** 2))),
    "--pearl-x": `${50 + half.x * 45}%`, "--pearl-y": `${50 + half.y * 35}%`,
    "--metal-x": `${50 + half.x * 100}%`, "--metal-y": `${50 + half.y * 100}%`,
  };
}
