import { expect, test } from "@playwright/test";

test("reduced motion keeps navigation functional without panel animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calendar");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeVisible();

  const reducedAnimationName = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "motion-popup-enter";
    document.body.append(probe);
    const animationName = window.getComputedStyle(probe).animationName;
    probe.remove();
    return animationName;
  });
  expect(reducedAnimationName).toBe("none");

  const profileTab = page.getByRole("link", { name: /Settings|You|Profile/ }).first();
  await expect(profileTab).toBeVisible();
  await profileTab.click();
  await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 });
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("motion overlays do not create mobile viewport overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-webkit");

  await page.goto("/calendar");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    rewardOverlayPointerEvents: window.getComputedStyle(
      document.querySelector("[data-motion='xp-reward-overlay']")!
    ).pointerEvents,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth
  );
  expect(dimensions.rewardOverlayPointerEvents).toBe("none");
});
