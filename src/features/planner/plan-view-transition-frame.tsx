"use client";

import { Component, createRef, type ReactNode } from "react";
import type { PlannerCalendarViewMode } from "./calendar-surface.types";
import {
  animatePlanScene,
  capturePlanScene,
  hidePlanContent,
  revealPlanContent,
  type PlanScene,
} from "./plan-view-morph";
import { prefersReducedMotion } from "./plan-view-transition";

interface Props {
  viewMode: PlannerCalendarViewMode;
  children: ReactNode;
}

/**
 * `getSnapshotBeforeUpdate` is the only lifecycle that reads the DOM after render but
 * before React commits it, which is what measuring the outgoing view requires. Hooks
 * have no equivalent, so this surface stays a class.
 */
export class PlanViewTransitionFrame extends Component<Props> {
  private readonly rootRef = createRef<HTMLDivElement>();
  private readonly contentRef = createRef<HTMLDivElement>();
  private animation: ReturnType<typeof animatePlanScene> | null = null;
  private frame = 0;
  private pendingScene: PlanScene | null = null;

  getSnapshotBeforeUpdate(previous: Props): PlanScene | null {
    const root = this.rootRef.current;
    if (previous.viewMode === this.props.viewMode || !root || prefersReducedMotion()) {
      return null;
    }
    // An interrupted morph hands over its in-flight geometry so the next one
    // continues from where the pixels actually are.
    const scene = this.animation?.snapshot() ?? this.pendingScene ?? capturePlanScene(root, previous.viewMode);
    this.animation?.cancel();
    this.animation = null;
    cancelAnimationFrame(this.frame);
    return scene;
  }

  componentDidUpdate(_previous: Props, _state: unknown, scene?: PlanScene | null) {
    const content = this.contentRef.current;
    if (!scene || !content) {
      return;
    }
    hidePlanContent(content);
    this.pendingScene = scene;
    // Month alignment runs synchronously in layout effects before this frame.
    this.frame = requestAnimationFrame(() => this.begin(scene));
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frame);
    this.animation?.cancel();
  }

  private begin(scene: PlanScene) {
    const root = this.rootRef.current;
    const content = this.contentRef.current;
    if (!root || !content) {
      if (content) {
        revealPlanContent(content);
      }
      return;
    }
    if (this.props.viewMode === "day") {
      // Retain the calendar's room on quiet days, including tall Week agendas.
      // This is the actual Day layout, not temporary space removed at handoff.
      root.style.setProperty("--plan-day-canvas-height", `${scene.clip.height}px`);
    }
    const next = capturePlanScene(root, this.props.viewMode);
    this.pendingScene = null;
    this.animation = animatePlanScene(root, content, scene, next, () => {
      this.animation = null;
    });
  }

  render() {
    return (
      <div ref={this.rootRef} className="relative" data-plan-view-frame="true">
        <div
          ref={this.contentRef}
          data-plan-view={this.props.viewMode}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}
