"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  Segments,
  StudyDialog,
} from "../primitives";
import { Info } from "lucide-react";

const SCORE_RANGES = {
  "1M": {
    labels: ["Sep 8", "Sep 14", "Sep 20", "Sep 26", "Oct 2", "Oct 8"],
    values: [622, 640, 655, 670, 690, 704.8],
  },
  "3M": {
    labels: ["Jul 8", "Jul 26", "Aug 13", "Aug 31", "Sep 19", "Oct 8"],
    values: [450, 486, 530, 590, 650, 704.8],
  },
  YTD: {
    labels: ["Jan", "Mar", "May", "Jul", "Sep", "Oct"],
    values: [30, 160, 320, 450, 620, 704.8],
  },
} as const;
export function ScoreConcept({ embedded = false }: { embedded?: boolean }) {
  const [range, setRange] = useState<keyof typeof SCORE_RANGES>("YTD");
  const [point, setPoint] = useState(5);
  const [definition, setDefinition] = useState(false);
  const data = SCORE_RANGES[range];
  const points = data.values.map((value, index) => ({
    x: 24 + index * 118,
    y: 185 - (value / 800) * 160,
  }));
  return (
    <>
      {!embedded && <AppNav active="Growth" />}
      <div className={embedded ? "" : "rf-canvas"}>
        {!embedded && (
          <Heading eyebrow="Growth" title="Your work, over time." />
        )}
        <Panel>
          <div className="rf-row">
            <div>
              <div className="rf-actions">
                <h3 className="type-heading">Goal score</h3>
                <Action
                  variant="ghost"
                  aria-label="Explain goal score"
                  onClick={() => setDefinition(true)}
                >
                  <Info aria-hidden size={18} />
                </Action>
              </div>
              <p className="rf-muted">
                A picture of your recent completion pace.
              </p>
            </div>
            <div className="text-right">
              <p className="rf-muted">Current score</p>
              <p className="rf-score type-stat">704.8</p>
              <button
                type="button"
                className="underline text-sm min-h-11"
                onClick={() => setDefinition(true)}
              >
                Top 6% · comparison notes
              </button>
            </div>
          </div>
          <div className="mt-6">
            <Segments
              label="Score range"
              values={["1M", "3M", "YTD"]}
              value={range}
              onChange={(value) => {
                setRange(value);
                setPoint(5);
              }}
            />
          </div>
          <svg
            className="rf-chart"
            viewBox="0 0 640 230"
            role="group"
            aria-label={`Sample goal score trend, ${range}`}
          >
            <title>
              Sample goal score trend. Focus or select a point for its value.
            </title>
            {[0, 400, 800].map((value) => (
              <g key={value}>
                <line
                  className="rf-chart-grid"
                  x1={24}
                  x2={614}
                  y1={185 - (value / 800) * 160}
                  y2={185 - (value / 800) * 160}
                />
                <text x={24} y={178 - (value / 800) * 160}>
                  {value}
                </text>
              </g>
            ))}
            <polyline
              className="rf-chart-line"
              points={points.map((item) => `${item.x},${item.y}`).join(" ")}
            />
            {points.map((item, index) => (
              <g key={index}>
                <circle
                  className="rf-chart-point"
                  cx={item.x}
                  cy={item.y}
                  r={point === index ? 6 : 4}
                />
                <circle
                  cx={item.x}
                  cy={item.y}
                  r={20}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-label={`${data.labels[index]} score ${data.values[index]}`}
                  onFocus={() => setPoint(index)}
                  onClick={() => setPoint(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setPoint(index);
                    }
                  }}
                />
                <text
                  x={item.x}
                  y={218}
                  textAnchor={
                    index === 0 ? "start" : index === 5 ? "end" : "middle"
                  }
                >
                  {data.labels[index]}
                </text>
              </g>
            ))}
          </svg>
          <Notice>
            {data.labels[point]} · {data.values[point]} points · illustrative
            sample
          </Notice>
        </Panel>
        <StudyDialog
          open={definition}
          onOpenChange={setDefinition}
          title="About goal score"
          description="Context for the number, not another chart."
        >
          <div className="rf-stack mt-6">
            <p>
              Goal score reflects your completion pace relative to your usual
              activity. It is not a grade for an individual goal.
            </p>
            <p className="rf-muted">
              The score and percentile here are fictional fixtures. A production
              Top 6% explanation must name the actual comparison population and
              calculation window; this study does not invent those rules.
            </p>
          </div>
        </StudyDialog>
      </div>
    </>
  );
}
