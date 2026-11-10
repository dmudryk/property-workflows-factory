// AC-VENDOR-10 — стан інтерфейсу: вендор без жодної задачі відкриває список запусків — «No tasks assigned to you yet.»
// без порожньої таблиці. Сторінка лише читає; «Дано» — синтетичний вендор uat-…-w без задач (@writes:
// vendor-world.setup.ts створює, cleanup.teardown.ts прибирає) — так «Дано» не залежить від того, чи призначали
// задачі спільному vendor@example.test на проді.
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { authFile, readWorld, tasksAssignedTo } from "./support/vendor-world";

test.use({ storageState: authFile("w") });

const MESSAGE = "No tasks assigned to you yet.";

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-10: вендор без задач відкриває список запусків — «No tasks assigned to you yet.», без порожньої таблиці",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-10" } },
  async ({ page }) => {
    const world = readWorld();
    const V = world.users.w;

    await given(`vendor V (${V.email}) to whom no task is assigned`, async () => {
      expect(await tasksAssignedTo(V.id)).toBe(0);
    });

    await when("V opens the list of runs", async () => {
      await page.goto("/runs");
      await expect(page.getByTestId("user-email")).toHaveText(V.email);
    });

    await thenStep(
      page,
      {
        clause: 'V sees the message "No tasks assigned to you yet." and no empty table',
        visible: [`the message «${MESSAGE}»`],
        hidden: ["no empty table: the page has no table and no column headers"],
      },
      async () => {
        await expect(page.getByTestId("empty-state").getByText(MESSAGE, { exact: true })).toBeVisible();
        await expect(page.getByRole("table")).toHaveCount(0);
        await expect(page.getByRole("columnheader")).toHaveCount(0);
      },
    );
  },
);
