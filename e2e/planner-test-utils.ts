import type { Page } from "@playwright/test";

export async function clearPlannerTabCache(page: Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("tab-data-cache:v1:")) {
        sessionStorage.removeItem(key);
      }
    }
  });
}
