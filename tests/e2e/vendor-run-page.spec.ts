// AC-VENDOR-04 — вендор у запуску бачить лише свої задачі: назва, секція, «required» / «optional», статус; без задач
// інших, без email інших користувачів і без прогресу всього запуску. Сторінка лише читає; «Дано» — синтетичний світ
// (@writes: vendor-world.setup.ts / cleanup.teardown.ts): V — uat-…-v, виконавець задач 3 і 4 в «Apartment 12, move-in».
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { CASE_APT12, authFile, readWorld, runTaskRows } from "./support/vendor-world";

test.use({ storageState: authFile("v") });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

const label = (required: boolean) => (required ? "required" : "optional");

test(
  "AC-VENDOR-04: вендор V відкриває «Apartment 12, move-in» — рівно задачі 3 і 4 з назвою, секцією, позначкою й статусом, без задач 1, 2, 5, чужих email і прогресу запуску",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-04" } },
  async ({ page }) => {
    const world = readWorld();
    const V = world.users.v;
    const tasks = world.template.tasks;
    const [, , task3, task4] = tasks;
    const others = [tasks[0], tasks[1], tasks[4]];

    await given(`vendor V (${V.email}) who is the assignee of tasks 3 and 4 in the run "Apartment 12, move-in" (5 tasks)`, async () => {
      const rows = await runTaskRows(world.runs.apt12.id);
      expect(rows).toHaveLength(5);
      expect(rows.map((t) => t.assignee_id === V.id)).toEqual([false, false, true, true, false]);
    });

    await when("V opens this run", async () => {
      await page.goto("/runs");
      await page.getByRole("link", { name: CASE_APT12, exact: true }).click();
      await page.waitForURL((url) => url.pathname === `/runs/${world.runs.apt12.id}`);
    });

    await thenStep(
      page,
      {
        clause:
          'V sees exactly tasks 3 and 4, each with its name, its section, the mark "required" or "optional" and its status, and does not see tasks 1, 2 and 5, the emails of other users or the progress of the whole run',
        visible: [
          `task 3 «${task3.name}» in the section «${task3.section}», marked «${label(task3.required)}», with the status «to do»`,
          `task 4 «${task4.name}» in the section «${task4.section}», marked «${label(task4.required)}», with the status «to do»`,
        ],
        hidden: [
          "exactly 2 tasks on the page",
          `none of tasks 1, 2 and 5: ${others.map((t) => `«${t.name}»`).join(", ")}`,
          `no emails of other users: the only email on the page is V's own (${V.email}, in the user card)`,
          "no progress of the whole run: no «N of 5 done»; the only progress on the page is «Your tasks: 0 of 2 done»",
        ],
      },
      async () => {
        const rows = page.getByTestId("run-task");
        await expect(rows).toHaveCount(2);
        for (const [i, task] of [task3, task4].entries()) {
          const row = rows.nth(i);
          await expect(row.getByText(task.name, { exact: true })).toBeVisible();
          await expect(row.getByTestId("task-required")).toHaveText(label(task.required));
          await expect(row.getByTestId("task-status")).toHaveText("to do");
          // Секція — заголовок картки, у якій стоїть задача (картку шукаємо за назвою задачі: вона унікальна).
          const card = page.locator("[data-slot=card]").filter({ has: page.getByText(task.name, { exact: true }) });
          await expect(card.getByRole("heading", { level: 2 })).toHaveText(task.section);
        }
        for (const task of others) await expect(page.getByText(task.name, { exact: true })).toHaveCount(0);
        const body = await page.locator("body").innerText();
        expect([...new Set(body.match(/[\w.+-]+@example\.test/gi) ?? [])]).toEqual([V.email]);
        await expect(page.getByText(/of 5 done/)).toHaveCount(0);
        await expect(page.getByTestId("run-progress")).toHaveText("Your tasks: 0 of 2 done");
      },
    );
  },
);
