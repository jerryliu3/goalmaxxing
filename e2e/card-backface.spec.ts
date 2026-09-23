import { expect, test } from "@playwright/test";

test("membership front is culled as a whole through horizontal and vertical flips", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/settings");
  const frame = page.locator("[data-card-object] .tempo-card-frame").first();
  await expect(frame).toBeVisible();
  await frame.scrollIntoViewIfNeeded();

  // Probe the actual production front boundary with a composited descendant.
  // An uncullled flat wrapper keeps this hit-testable from behind even when
  // individual lettering layers have their own backface-visibility rules.
  await frame.evaluate(element => {
    const probe = document.createElement("span");
    probe.dataset.backfaceProbe = "";
    probe.textContent = "Front";
    probe.style.cssText = "position:absolute;left:45%;top:45%;width:10%;height:10%;z-index:999;pointer-events:auto;transform:translateZ(1px);backface-visibility:hidden;-webkit-backface-visibility:hidden;background:red";
    element.append(probe);
    const object = element.closest<HTMLElement>("[data-card-object]")!;
    object.style.transformStyle = "preserve-3d";
  });

  for (const [transform, frontVisible] of [
    ["rotateY(0deg)", true],
    ["rotateY(180deg)", false],
    ["rotateX(180deg)", false],
    ["rotateX(180deg) rotateY(180deg)", true],
    ["rotateY(360deg)", true],
  ] as const) {
    await frame.evaluate((element, pose) => {
      element.closest<HTMLElement>("[data-card-object]")!.style.transform = pose;
    }, transform);
    await expect.poll(() => frame.evaluate(element => {
      const probe = element.querySelector<HTMLElement>("[data-backface-probe]")!;
      const rect = probe.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === probe;
    })).toBe(frontVisible);
  }
});
