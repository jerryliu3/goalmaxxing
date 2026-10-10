import { expect, test } from "@playwright/test";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});

test("portrait editorial journey retains its example through landscape", async ({
  page,
}) => {
  await page.goto("/");
  const mobile = page.getByTestId("mobile-landing");
  const desktop = page.getByTestId("desktop-landing");
  await expect(mobile).toBeVisible();
  await expect(desktop).toBeHidden();
  await mobile.getByRole("button", { name: /12 days/ }).click();
  await mobile.getByRole("button", { name: /Move Thursday/ }).click();
  await expect(mobile.getByText("One change to review")).toBeVisible();
  await expect(mobile.getByRole("progressbar")).toHaveAttribute("value", "2");
  const instance = await mobile.elementHandle();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(desktop).toBeVisible();
  await expect(mobile).toBeHidden();
  await expect(desktop.getByRole("heading", { level: 1 })).toContainText(
    "Achieve your goals",
  );
  expect(await instance!.evaluate((node) => node.isConnected)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(mobile.getByRole("button", { name: /12 days/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(mobile.getByText("One change to review")).toBeVisible();
  await mobile.getByRole("button", { name: "Save example" }).click();
  await expect(
    mobile.getByText("Example plan saved. Friday is ready."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await expect(page.getByRole("link", { name: "Contact" })).toHaveAttribute(
    "href",
    "mailto:hello@goalmaxxing.xyz",
  );
  await expect(
    page.getByRole("link", { name: "Privacy", exact: true }),
  ).toHaveAttribute("href", "/privacy");
  await expect(
    page.getByRole("link", { name: "Terms", exact: true }),
  ).toHaveAttribute("href", "/terms");
});
