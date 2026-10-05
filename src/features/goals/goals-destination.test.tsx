import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { resolveDuoLanes, type DuoScope, type DuoLaneSubject } from "@cadence/shared/social/duo";
import { GoalsDestination } from "./goals-destination";

const mocks = vi.hoisted(() => ({ scope: "both" as DuoScope, library: vi.fn() }));
const viewer: DuoLaneSubject = { id: "viewer", userId: "me", label: "Me", readOnly: false };
const partner: DuoLaneSubject = { id: "partner", userId: "them", label: "Partner", readOnly: true };
vi.mock("@/features/social/duo/use-duo-surface", () => ({ useDuoSurface: () => ({ scope: mocks.scope, viewer, partner }) }));
vi.mock("@/features/social/duo/duo-lanes", () => ({
  DuoLanes: ({ scope, renderLane }: { scope: DuoScope; renderLane: (subject: DuoLaneSubject) => React.ReactNode }) =>
    <>{resolveDuoLanes({ scope, viewer, partner }).map(subject => <div key={subject.id}>{renderLane(subject)}</div>)}</>,
}));
vi.mock("@/features/insights/folio/goal-library-page", () => ({ GoalLibraryPage: (props: unknown) => { mocks.library(props); return null; } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it.each(["me", "partner", "both"] as const)("respects %s Mode and each lane's write permissions", scope => {
  mocks.scope = scope;
  render(<GoalsDestination />);
  const expected = resolveDuoLanes({ scope, viewer, partner });
  expect(mocks.library).toHaveBeenCalledTimes(expected.length);
  expected.forEach((subject, index) => {
    expect(mocks.library).toHaveBeenNthCalledWith(index + 1, expect.objectContaining({
      subjectUserId: subject.userId, readOnly: subject.readOnly, anchorSections: index === 0, showBack: false,
    }));
  });
});
