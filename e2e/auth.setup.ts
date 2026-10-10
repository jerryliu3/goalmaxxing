import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authStatePath = path.resolve("playwright/.auth/alice.json");

setup("authenticate seeded Alice account", async ({ page, baseURL }) => {
  // Tour progress is persisted for the seeded account, so never use this
  // fixture against an account on a remote application.
  expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
  await page.goto("/login");
  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");

  // Filling before React hydration lets the mount reset the inputs, which
  // showed up intermittently as a submitted form with an empty Email and a
  // populated Password. Re-fill until both values stick.
  await expect(async () => {
    await email.fill("alice@example.com");
    await password.fill("password123");
    await expect(email).toHaveValue("alice@example.com");
    await expect(password).toHaveValue("password123");
  }).toPass({ timeout: 15_000 });

  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/calendar/);
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeVisible();

  // Onboarding now reads account progress, not browser-local completion flags.
  // The seed completes setup; skip the optional tours through the canonical API.
  const onboardingResponse = await page.request.post("/api/onboarding", {
    data: { action: "skip-tours" },
  });
  expect(onboardingResponse.status(), await onboardingResponse.text()).toBe(200);

  await page.evaluate(() => {
    window.sessionStorage.setItem("gm-boot-ready", "1");
    window.localStorage.setItem("gm-boot-ready", "1");
  });
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Your space is ready." })).toHaveCount(0);
  await mkdir(path.dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});
