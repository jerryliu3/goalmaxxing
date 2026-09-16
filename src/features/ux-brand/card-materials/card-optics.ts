export type CardPose = { x: number; y: number };
export const REST_POSE: CardPose = { x: 7, y: -14 };
export const TILTED_POSE: CardPose = { x: -16, y: 25 };
export const FLAT_POSE: CardPose = { x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function pointerPose(x: number, y: number): CardPose {
  return { x: (0.5 - clamp(y, 0, 1)) * 36, y: (clamp(x, 0, 1) - 0.5) * 52 };
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
  return {
    "--rx": `${pose.x}deg`, "--ry": `${pose.y}deg`,
    "--light-x": `${50 + light.x * 65}%`, "--light-y": `${50 + light.y * 65}%`,
    "--rim-light-x": String(light.x), "--rim-light-y": String(light.y),
    "--shine-position": `${clamp(50 + half.x * 72 + half.y * 36, 8, 92)}%`,
    "--shine-angle": `${116 + pose.y * 0.65 - pose.x * 0.4}deg`,
    "--shine-strength": String(0.28 + 0.5 * Math.exp(-5 * (half.x ** 2 + half.y ** 2))),
    "--metal-x": `${50 + half.x * 100}%`, "--metal-y": `${50 + half.y * 100}%`,
  };
}
