"use client";

import { motion, useReducedMotion } from "motion/react";
import { LandingWowMountain } from "@/components/landing/landing-wow-mountain";
import { LandingWowPinnedChapter } from "@/components/landing/landing-wow-pinned-chapter";
import { LandingWowProductStage } from "@/components/landing/landing-wow-product-stage";
import {
  COMBINED_CHAPTER_HEIGHT_VH,
  COMBINED_SCENE_STOPS,
  getCaption,
  getSceneState,
  type CombinedScene,
} from "@/components/landing/landing-wow-progress";

export function LandingWowChapter({ progress }: { progress?: number }) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <LandingWowPinnedChapter
      testId="landing-wow-chapter"
      heightVh={COMBINED_CHAPTER_HEIGHT_VH}
      progress={progress}
      reducedMotion={reducedMotion}
    >
      {(chapterProgress) => {
        const state = getSceneState(chapterProgress, COMBINED_SCENE_STOPS);
        return (
          <ChapterStage
            caption={getCaption(state.scene, state.local)}
            scene={state.scene}
            local={state.local}
            progress={chapterProgress}
          />
        );
      }}
    </LandingWowPinnedChapter>
  );
}

function ChapterStage({
  caption,
  scene,
  local,
  progress,
}: {
  caption: string;
  scene: CombinedScene;
  local: number;
  progress: number;
}) {
  return (
    <div className="relative h-full text-[#3E3A36]">
      <LandingWowMountain progress={progress} />
      <div className="absolute inset-0 z-10">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <p className="type-eyebrow text-[11px] text-gain">
            The journey
          </p>
          <motion.p
            key={caption}
            data-wow-caption=""
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-[#3E3A36] sm:text-3xl"
          >
            {caption}
          </motion.p>
        </div>
        <div
          data-testid="wow-product-slot"
          className="absolute inset-x-0 top-[36%] mx-auto w-full max-w-6xl px-4 sm:px-6"
        >
          <div className="ml-auto w-full max-w-md sm:max-w-lg">
            <LandingWowProductStage scene={scene} local={local} />
          </div>
        </div>
      </div>
    </div>
  );
}
