"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  CLIMB_TRAIL_PATH,
  getClimbBiome,
  getClimbCamera,
  getClimbIndicatorPosition,
} from "@/components/landing/landing-wow-progress";

export function LandingWowMountain({ progress }: { progress: number }) {
  const reactId = useId().replace(/:/g, "");
  const pathRef = useRef<SVGPathElement | null>(null);
  const biome = getClimbBiome(progress);
  const camera = getClimbCamera(progress);
  const trailProgress = Math.min(1, Math.max(0, progress));
  const fallback = getClimbIndicatorPosition(trailProgress);
  const [marker, setMarker] = useState({
    x: (fallback.x / 100) * 1440,
    y: (fallback.y / 100) * 900,
  });

  useLayoutEffect(() => {
    const path = pathRef.current;
    const fallbackPoint = getClimbIndicatorPosition(trailProgress);
    const fallbackMarker = {
      x: (fallbackPoint.x / 100) * 1440,
      y: (fallbackPoint.y / 100) * 900,
    };
    if (!path || typeof path.getTotalLength !== "function") {
      setMarker(fallbackMarker);
      return;
    }
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length <= 0) {
      setMarker(fallbackMarker);
      return;
    }
    const point = path.getPointAtLength(length * trailProgress);
    setMarker({ x: point.x, y: point.y });
  }, [trailProgress]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#F4F1EA]">
      <div
        className="absolute inset-0 origin-center"
        style={{
          transformOrigin: `${camera.focalX * 100}% ${camera.focalY * 100}%`,
          transform: `translate3d(0, ${camera.shiftY}%, 0) scale(${camera.scale})`,
        }}
      >
        <svg
          viewBox="0 0 1440 900"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${reactId}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E7EEF2" />
              <stop offset="42%" stopColor="#F3EFE6" />
              <stop offset="100%" stopColor="#E8DFD2" />
            </linearGradient>
            <radialGradient id={`${reactId}-sun`} cx="78%" cy="22%" r="34%">
              <stop offset="0%" stopColor="rgba(247, 236, 214, 0.95)" />
              <stop offset="48%" stopColor="rgba(217, 228, 232, 0.35)" />
              <stop offset="100%" stopColor="rgba(217, 228, 232, 0)" />
            </radialGradient>
            <linearGradient id={`${reactId}-far`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E4ECEF" />
              <stop offset="45%" stopColor="#C5D3DC" />
              <stop offset="100%" stopColor="#A9BCC8" />
            </linearGradient>
            <linearGradient id={`${reactId}-mid`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4EEE4" />
              <stop offset="22%" stopColor="#E2D4C4" />
              <stop offset="100%" stopColor="#C9B8A6" />
            </linearGradient>
            <linearGradient id={`${reactId}-rose`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E3C8BB" />
              <stop offset="100%" stopColor="#C9A494" />
            </linearGradient>
            <linearGradient id={`${reactId}-sage`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D5DDC8" />
              <stop offset="100%" stopColor="#9EAF93" />
            </linearGradient>
            <linearGradient id={`${reactId}-near`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F7F3EC" />
              <stop offset="18%" stopColor="#E8DFD2" />
              <stop offset="100%" stopColor="#D4C4B5" />
            </linearGradient>
            <linearGradient id={`${reactId}-trail`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#C9A494" />
              <stop offset="55%" stopColor="#A9BCC8" />
              <stop offset="100%" stopColor="#9EAF93" />
            </linearGradient>
            <filter id={`${reactId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="1440" height="900" fill={`url(#${reactId}-sky)`} />
          <ellipse
            cx="1120"
            cy="210"
            rx="280"
            ry="160"
            fill={`url(#${reactId}-sun)`}
          />

          <g style={{ transform: `translate3d(0, ${(1 - trailProgress) * 16}px, 0)` }}>
            <path
              d="M -40 430 L 180 260 L 310 340 L 470 210 L 640 330 L 820 180 L 980 300 L 1180 150 L 1380 280 L 1500 220 L 1500 900 L -40 900 Z"
              fill={`url(#${reactId}-far)`}
            />
            <path
              d="M 820 180 L 980 300 L 910 255 Z"
              fill={`url(#${reactId}-rose)`}
              opacity="0.55"
            />
          </g>

          <g style={{ transform: `translate3d(0, ${(1 - trailProgress) * 10}px, 0)` }}>
            <path
              d="M -60 560 L 80 420 L 230 500 L 390 330 L 560 470 L 740 300 L 930 430 L 1120 250 L 1310 390 L 1500 300 L 1500 900 L -60 900 Z"
              fill={`url(#${reactId}-mid)`}
            />
            <path
              d="M 390 330 L 560 470 L 470 410 Z"
              fill={`url(#${reactId}-sage)`}
              opacity="0.45"
            />
            <path
              d="M 1120 250 L 1310 390 L 1210 328 Z"
              fill={`url(#${reactId}-rose)`}
              opacity="0.5"
            />
          </g>

          <path
            d="M -40 640 C 180 600 280 620 420 590 C 620 550 740 610 920 570 C 1120 525 1280 560 1500 530 L 1500 900 L -40 900 Z"
            fill="#E8DFD2"
            opacity="0.55"
          />

          <path
            ref={pathRef}
            d={CLIMB_TRAIL_PATH}
            fill="none"
            stroke="transparent"
            strokeWidth="8"
            aria-hidden="true"
          />
          <path
            data-testid="wow-climb-trail"
            d={CLIMB_TRAIL_PATH}
            fill="none"
            stroke={`url(#${reactId}-trail)`}
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - trailProgress}
            filter={`url(#${reactId}-glow)`}
          />

          <g
            data-testid="wow-climb-indicator"
            data-climb-biome={biome}
            data-climb-x={marker.x.toFixed(1)}
            data-climb-y={marker.y.toFixed(1)}
            transform={`translate(${marker.x} ${marker.y})`}
          >
            <rect
              x="-22"
              y="-38"
              width="44"
              height="18"
              rx="9"
              fill="#7E96A6"
            />
            <text
              x="0"
              y="-25"
              textAnchor="middle"
              fill="#F7F3EC"
              fontSize="10"
              fontWeight="700"
            >
              You
            </text>
            <circle r="11" fill="#F7F3EC" filter={`url(#${reactId}-glow)`} />
            <circle r="5.5" fill="#7E96A6" />
            <text
              y="28"
              textAnchor="middle"
              fill="#6F6A64"
              fontSize="9"
              fontWeight="600"
              letterSpacing="1.4"
            >
              {biome.toUpperCase()}
            </text>
          </g>

          <g>
            <path
              d="M -80 760 L 40 640 L 170 710 L 310 490 L 470 680 L 640 500 L 810 640 L 980 470 L 1180 620 L 1360 510 L 1520 600 L 1520 900 L -80 900 Z"
              fill={`url(#${reactId}-near)`}
            />
            <path
              d="M 640 500 L 810 640 L 720 575 Z"
              fill={`url(#${reactId}-sage)`}
              opacity="0.4"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
