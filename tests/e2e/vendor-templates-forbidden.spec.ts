// AC-VENDOR-08 — відмова в браузері (заборонена роль): вендор відкриває список шаблонів за прямим посиланням —
// «Not enough rights» і жодного шаблону. Лише читання. У двійнику демо-акаунта vendor@example.test немає (його
// supabase/demo-users.json фабриці змінювати не можна), тож вендор V — синтетичний uat-…-v зі світу (vendor-world.setup.ts).
// Правило даних живе в базі (templates_select_visible) — його доводить tests/db/vendor.test.ts (SQL-мутант V7).
// «Жодного шаблону» має сенс, лише якщо шаблони на проді є: назви беремо зі списку шаблонів менеджера A
// (окремий контекст браузера, лише читання) — саме їх на сторінці вендора бути не має.
import { expect, test, type Browser } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { authFile, readWorld } from "./support/vendor-world";

test.use({ storageState: authFile("v") });

/** Назви шаблонів, які бачить менеджер A на /templates (збережені версії). */
async function templatesSeenByManager(browser: Browser): Promise<string[]> {
  const context = await browser.newContext({ storageState: "playwright/.auth/manager_a.json" });
  const manager = await context.newPage();
  await manager.goto("/templates");
  const names = (await manager.getByRole("table").getByRole("link").allTextContents()).map((n) => n.trim());
  await context.close();
  return names;
}

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-08: вендор V відкриває список шаблонів за прямим посиланням — «Not enough rights», жодного шаблону",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-08" } },
  async ({ page, browser }) => {
    const VENDOR = readWorld().users.v.email;
    let templates: string[] = [];

    await given(`vendor V (${VENDOR}) signed in`, async () => {
      await page.goto("/runs");
      await expect(page.getByTestId("user-email")).toHaveText(VENDOR);
      // Шаблони на проді є (інакше «жодного шаблону» нічого б не довело): менеджер A бачить «Tenant move-in».
      templates = await templatesSeenByManager(browser);
      expect(templates).toContain("Tenant move-in");
    });

    await when("V opens the list of templates by a direct link", async () => {
      await page.goto("/templates");
    });

    await thenStep(
      page,
      {
        clause: 'V sees the message "Not enough rights" and no template',
        visible: ["the message «Not enough rights»"],
        hidden: [
          "no template: no table and none of the templates that manager A sees on /templates (read in «Дано») on the page",
          `the page is the list of templates (/templates), signed in as V (${VENDOR})`,
        ],
      },
      async () => {
        await expect(page).toHaveURL((url) => url.pathname === "/templates");
        await expect(page.getByTestId("user-email")).toHaveText(VENDOR);
        await expect(page.getByRole("main").getByRole("alert")).toHaveText("Not enough rights");
        await expect(page.getByRole("table")).toHaveCount(0);
        for (const name of templates) await expect(page.getByText(name, { exact: true })).toHaveCount(0);
      },
    );
  },
);
