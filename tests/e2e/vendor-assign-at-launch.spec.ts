// AC-VENDOR-01 — основний сценарій: менеджер A під час запуску призначає вендора V виконавцем задач 3 і 4.
// Пише в базу (@writes): A — синтетичний менеджер uat-…-a, V — синтетичний вендор uat-…-v1 (support/vendor-world.ts);
// запуск A прибирає cleanup.teardown.ts разом із ними (OWNED_ROWS). Сторінка запуску з 5 задачами довша за 800 px —
// вищий вікно, щоб на кадрі «Тоді» були всі задачі.
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { CASE_APT12, TEMPLATE_NAME, authFile, readWorld, runManager, runTaskRows } from "./support/vendor-world";

test.use({ storageState: authFile("a"), viewport: { width: 1280, height: 1000 } });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-01: менеджер A запускає «Tenant move-in» і призначає вендора V виконавцем задач 3 і 4 — у задач 1, 2 і 5 виконавець A",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-01" } },
  async ({ page }) => {
    const world = readWorld();
    const A = world.users.a.email;
    const V = world.users.v1.email;
    const tasks = world.template.tasks;
    let runId = "";

    await given(`manager A (${A}), vendor V (${V}) and the template "Tenant move-in" with 5 tasks`, async () => {
      await page.goto("/runs/new");
      await expect(page.getByTestId("user-email")).toHaveText(A);
      await page.getByRole("combobox", { name: "Template" }).click();
      await page.getByRole("option", { name: TEMPLATE_NAME, exact: true }).click();
      await page.waitForURL((url) => url.searchParams.get("template") === world.template.id);
      await expect(page.getByText("5 tasks", { exact: true })).toBeVisible();
    });

    await when(`A launches the template for the case "Apartment 12, move-in" and assigns V as the assignee of tasks 3 and 4`, async () => {
      await page.getByLabel("Case name").fill(CASE_APT12);
      // Вибір виконавця — список дизайн-системи (Base UI Select): кнопка-combobox з підписом задачі, пункти — option.
      // Вибране значення — у полі select-value кнопки (текст самої кнопки містить ще й символ іконки «▼»).
      for (const task of [tasks[2], tasks[3]]) {
        const picker = page.getByRole("combobox", { name: task.name });
        await picker.click();
        await page.getByRole("option", { name: V, exact: true }).click();
        await expect(picker.locator("[data-slot=select-value]")).toHaveText(V);
      }
      await page.getByRole("button", { name: "Launch run" }).click();
      await page.waitForURL(/\/runs\/[0-9a-f-]{36}$/);
      runId = new URL(page.url()).pathname.split("/").at(-1)!;
    });

    await thenStep(
      page,
      {
        clause: "tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A",
        visible: [
          `next to task 3 «${tasks[2].name}» and task 4 «${tasks[3].name}» — the email ${V}`,
          `next to task 1 «${tasks[0].name}», task 2 «${tasks[1].name}» and task 5 «${tasks[4].name}» — the email ${A}`,
        ],
        hidden: [
          `the run page is the new run «${CASE_APT12}» with exactly 5 tasks, in the order of the template`,
          "in the database: tasks 3 and 4 — assignee V, tasks 1, 2 and 5 — A, and A is the run manager",
        ],
      },
      async () => {
        await expect(page.getByRole("heading", { level: 1, name: CASE_APT12, exact: true })).toBeVisible();
        const rows = page.getByTestId("run-task");
        await expect(rows).toHaveCount(5);
        const expected = [A, A, V, V, A];
        for (const [i, task] of tasks.entries()) {
          const row = rows.nth(i);
          await expect(row.getByText(task.name, { exact: true })).toBeVisible();
          await expect(row.getByTestId("task-assignee")).toHaveText(expected[i]);
          await expect(row).toBeInViewport();
        }
        const ids = [world.users.a.id, world.users.a.id, world.users.v1.id, world.users.v1.id, world.users.a.id];
        expect((await runTaskRows(runId)).map((t) => t.assignee_id)).toEqual(ids);
        expect(await runManager(runId)).toBe(world.users.a.id);
      },
    );
  },
);
