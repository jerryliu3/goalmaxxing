"use client";
import { Component, createRef, type ReactNode } from "react";
import type { PlannerCalendarViewMode } from "./calendar-surface.types";
import { animatePlanScene, capturePlanScene, type PlanScene } from "./plan-view-morph";
interface Props {
    viewMode: PlannerCalendarViewMode;
    children: ReactNode;
}
// The snapshot lifecycle reads the outgoing DOM before React replaces month/week/day.
// Measuring in a passive effect is too late: the missing dates have already disappeared.
export class PlanViewTransitionFrame extends Component<Props> {
    private root = createRef<HTMLDivElement>();
    private content = createRef<HTMLDivElement>();
    private animation: ReturnType<typeof animatePlanScene> | null = null;
    private frame = 0;
    private pendingScene: PlanScene | null = null;
    getSnapshotBeforeUpdate(previous: Props): PlanScene | null {
        if (previous.viewMode === this.props.viewMode || !this.root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return null;
        const scene = this.animation?.snapshot() ?? this.pendingScene ?? capturePlanScene(this.root.current, previous.viewMode);
        this.animation?.cancel();
        this.animation = null;
        cancelAnimationFrame(this.frame);
        return scene;
    }
    componentDidUpdate(_previous: Props, _state: unknown, scene: PlanScene | null) {
        if (!scene || !this.content.current)
            return;
        this.pendingScene = scene;
        this.content.current.style.visibility = 'hidden';
        // Let the existing month-scroll alignment settle before measuring the destination.
        this.frame = requestAnimationFrame(() => {
            const root = this.root.current, content = this.content.current;
            if (!root || !content)
                return;
            const next = capturePlanScene(root, this.props.viewMode);
            this.pendingScene = null;
            this.animation = animatePlanScene(root, content, scene, next, () => { this.animation = null; });
        });
    }
    componentWillUnmount() { cancelAnimationFrame(this.frame); this.animation?.cancel(); }
    render() { return <div ref={this.root} className="relative" data-plan-view-frame="true"><div ref={this.content} data-plan-view={this.props.viewMode}>{this.props.children}</div></div>; }
}
