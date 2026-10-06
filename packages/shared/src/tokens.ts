export const radius = {
  baseRem: 0.875,
  smRem: 0.5,
  mdRem: 0.6875,
  lgRem: 0.875,
  xlRem: 1.25,
} as const;

export const motionDurations = {
  fastMs: 120,
  standardMs: 200,
  rewardMs: 560,
} as const;

export const motionEasings = {
  standard: [0.2, 0.8, 0.2, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,
};
