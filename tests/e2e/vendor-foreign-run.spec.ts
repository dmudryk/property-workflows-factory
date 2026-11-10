// AC-VENDOR-06 — відмова (чужі дані): вендор відкриває за прямим посиланням запуск, де в нього немає задач, —
// «Run not found» і жодної задачі. Сторінка лише читає; «Дано» — синтетичний світ (@writes: vendor-world.setup.ts /
// cleanup.teardown.ts): «Apartment 14, repair» менеджера uat-…-a, у якому вендор uat-…-v не має жодної задачі.
// Правило живе в базі (private.can_see_run, політики RLS) — його доводить tests/db/vendor.test.ts (SQL-мутант V5).
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { CASE_APT14, authFile, readWorld, runTaskRows } from "./support/vendor-world";

test.use({ storageState: authFile("v") });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-06: вендор V відкриває «Apartment 14, repair» за прямим посиланням — «Run not found», жодної задачі запуску",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-06" } },
  async ({ page }) => {
    const world = readWorld();
    const V = world.users.v;
    const run = world.runs.apt14;
    const names = world.template.tasks.map((t) => t.name);

    await given(`the run "Apartment 14, repair" in which vendor V (${V.email}) has no task`, async () => {
      const rows = await runTaskRows(run.id);
      expect(rows).toHaveLength(5);
      expect(rows.filter((t) => t.assignee_id === V.id)).toHaveLength(0);
    });

    await when("V opens the page of this run by a direct link", async () => {
      await page.goto(`/runs/${run.id}`);
    });

    await thenStep(
      page,
      {
        clause: 'V sees the message "Run not found" and none of the tasks of the run',
        visible: ["the message «Run not found»"],
        hidden: [
          `none of the tasks of the run: no task rows and none of the task names ${names.map((n) => `«${n}»`).join(", ")}`,
          `no case name «${CASE_APT14}» on the page; signed in as V (${V.email})`,
        ],
      },
      async () => {
        await expect(page).toHaveURL((url) => url.pathname === `/runs/${run.id}`);
        await expect(page.getByTestId("user-email")).toHaveText(V.email);
        await expect(page.getByRole("main").getByRole("alert")).toHaveText("Run not found");
        await expect(page.getByTestId("run-task")).toHaveCount(0);
        for (const name of names) await expect(page.getByText(name, { exact: true })).toHaveCount(0);
        await expect(page.getByText(CASE_APT14)).toHaveCount(0);
      },
    );
  },
);
