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
import { PLAN_VIEW_SWAP_CLASS, prefersReducedMotion } from "./plan-view-transition";

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

  getSnapshotBeforeUpdate(previous: Props): PlanScene | null {
    const root = this.rootRef.current;
    if (previous.viewMode === this.props.viewMode || !root || prefersReducedMotion()) {
      return null;
    }
    // An interrupted morph hands over its in-flight geometry so the next one
    // continues from where the pixels actually are.
    const scene = this.animation?.snapshot() ?? capturePlanScene(root, previous.viewMode);
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
    // Measured on the next frame so the destination has laid out. The month viewport
    // aligns its scroll from a passive effect that can land later still, which the
    // morph absorbs by re-reading a live anchor rather than by waiting here.
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
    const next = capturePlanScene(root, this.props.viewMode);
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
          className={PLAN_VIEW_SWAP_CLASS}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}
