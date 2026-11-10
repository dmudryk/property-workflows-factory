// AC-VENDOR-07 — відмова напряму, оминаючи сторінки: вендор V надсилає «позначити задачу 1 виконаною» прямо в Data API
// Supabase (public.mark_task_done зі своїм токеном), хоча задача 1 — менеджера A. Правило живе в базі
// (private.mark_task_done) — його доводить tests/db/vendor.test.ts (SQL-мутант V6); тут — виняток WS8: запит напряму
// і крок, що показує на екрані «що не змінилося» — сторінку запуску очима менеджера A (вендор задачі 1 не бачить).
// «Дано» — синтетичний світ (@writes: vendor-world.setup.ts / cleanup.teardown.ts). Сторінка з 5 задачами — вище вікно.
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { CASE_APT12, authFile, directRpc, readWorld, taskRow } from "./support/vendor-world";

// Два акаунти навмисно: браузер — менеджер A (лише він бачить задачу 1 — екран «що не змінилося»), а запит напряму
// надсилає вендор V своїм токеном (world.vendorAccessToken) поза браузером.
test.use({ storageState: authFile("a"), viewport: { width: 1280, height: 1000 } });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-07: вендор V напряму позначає виконаною задачу 1 менеджера A — відмова, задача 1 лишається «to do»",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-07" } },
  async ({ page }) => {
    const world = readWorld();
    const A = world.users.a;
    const V = world.users.v;
    const run = world.runs.apt12;
    const task1 = world.template.tasks[0];
    const row1 = page.getByTestId("run-task").nth(0);
    let response: Awaited<ReturnType<typeof directRpc>> | null = null;

    await given(
      `the run "Apartment 12, move-in" in which task 1 is assigned to manager A (${A.email}) and tasks 3 and 4 to vendor V (${V.email})`,
      async () => {
        await page.goto(`/runs/${run.id}`);
        await expect(page.getByRole("heading", { level: 1, name: CASE_APT12, exact: true })).toBeVisible();
        const rows = page.getByTestId("run-task");
        await expect(row1.getByText(task1.name, { exact: true })).toBeVisible();
        await expect(row1.getByTestId("task-assignee")).toHaveText(A.email);
        await expect(row1.getByTestId("task-status")).toHaveText("to do");
        await expect(rows.nth(2).getByTestId("task-assignee")).toHaveText(V.email);
        await expect(rows.nth(3).getByTestId("task-assignee")).toHaveText(V.email);
      },
    );

    await when("V tries to mark task 1 as done directly, bypassing the pages of the application", async () => {
      response = await directRpc(world.vendorAccessToken, "mark_task_done", { p_task_id: run.taskIds[0] });
    });

    await thenStep(
      page,
      {
        clause: 'task 1 stays "to do"',
        visible: [`task 1 «${task1.name}» with the status «to do» on the page of the run «${CASE_APT12}» (run manager A)`],
        hidden: [
          "V's direct request was refused: HTTP 403, code 42501, NOT_ALLOWED",
          "in the database task 1 is still to_do and nobody marked it (done_by is empty)",
          "the page was reloaded after the request",
        ],
      },
      async () => {
        await page.reload();
        await expect(row1.getByText(task1.name, { exact: true })).toBeVisible();
        await expect(row1.getByTestId("task-status")).toHaveText("to do");
        await expect(row1).toBeInViewport();
        expect(response).toMatchObject({ status: 403, code: "42501", message: "NOT_ALLOWED" });
        expect(await taskRow(run.taskIds[0])).toMatchObject({ status: "to_do", done_by: null });
      },
    );
  },
);
