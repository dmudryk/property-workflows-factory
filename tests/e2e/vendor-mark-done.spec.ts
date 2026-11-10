// AC-VENDOR-05 — вендор позначає свою задачу 3 (не останню обов'язкову) виконаною: «done» і «Your tasks: 1 of 2 done».
// Пише в базу (@writes): V — синтетичний вендор uat-…-v5 у своєму запуску «Apartment 12, move-in» (менеджер — uat-…-a),
// щоб позначка не змінила «Дано» інших AC; запуск і задачі прибирає cleanup.teardown.ts.
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { authFile, readWorld, runTaskRows, taskRow } from "./support/vendor-world";

test.use({ storageState: authFile("v5") });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-05: вендор V позначає задачу 3 (не останню обов'язкову) виконаною — «done» і «Your tasks: 1 of 2 done»",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-05" } },
  async ({ page }) => {
    const world = readWorld();
    const V = world.users.v5;
    const run = world.runs.apt12v5;
    const tasks = world.template.tasks;
    const task3 = tasks[2];
    const row = page.getByTestId("run-task").filter({ hasText: task3.name });

    await given(
      `vendor V (${V.email}) who is the assignee of task 3 with status "to do", which is not the last required task of the run "Apartment 12, move-in"`,
      async () => {
        const rows = await runTaskRows(run.id);
        expect(rows[2]).toMatchObject({ assignee_id: V.id, status: "to_do" });
        // Не остання обов'язкова: інші обов'язкові задачі запуску ще «to do».
        const otherRequired = rows.filter((t, i) => i !== 2 && tasks[i].required && t.status === "to_do");
        expect(otherRequired.length).toBeGreaterThan(0);
        await page.goto(`/runs/${run.id}`);
        await expect(page.getByTestId("user-email")).toHaveText(V.email);
        await expect(row.getByTestId("task-status")).toHaveText("to do");
        await expect(page.getByTestId("run-progress")).toHaveText("Your tasks: 0 of 2 done");
      },
    );

    await when("V marks task 3 as done", async () => {
      // Позначка оптимістична (DESIGN.md, розділ 6): чекаємо відповіді серверної дії (POST на сторінку запуску),
      // а тоді — свіжа сторінка, щоб «Тоді» показало збережений стан, а не лише оптимістичний.
      const saved = page.waitForResponse(
        (r) => r.request().method() === "POST" && new URL(r.url()).pathname === `/runs/${run.id}`,
      );
      await row.getByRole("button", { name: "Mark as done" }).click();
      await saved;
      await page.reload();
    });

    await thenStep(
      page,
      {
        clause: 'task 3 has status "done", and V sees "Your tasks: 1 of 2 done"',
        visible: [`task 3 «${task3.name}» with the status «done»`, "«Your tasks: 1 of 2 done»"],
        hidden: [
          "after reloading the page (the saved state, not only the optimistic one)",
          "in the database task 3 is done and marked by V",
          "no confirmation «This cannot be undone» was asked: task 3 is not the last required task",
        ],
      },
      async () => {
        await expect(row.getByTestId("task-status")).toHaveText("done");
        await expect(row.getByRole("button", { name: "Mark as done" })).toHaveCount(0);
        await expect(page.getByTestId("run-progress")).toHaveText("Your tasks: 1 of 2 done");
        await expect(page.getByTestId("confirm-done")).toHaveCount(0);
        expect(await taskRow(run.taskIds[2])).toMatchObject({ status: "done", done_by: V.id });
      },
    );
  },
);
