// AC-VENDOR-03 — список запусків вендора: лише запуск з його задачами, статус запуску й «Your tasks: N of K done».
// Сама сторінка лише читає; «Дано» — синтетичний світ (@writes: його створює vendor-world.setup.ts і прибирає
// cleanup.teardown.ts): V — uat-…-v, задачі 3 і 4 в «Apartment 12, move-in», жодної в «Apartment 14, repair».
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { CASE_APT12, CASE_APT14, authFile, readWorld, runTaskRows } from "./support/vendor-world";

test.use({ storageState: authFile("v") });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-03: вендор V відкриває список запусків — лише «Apartment 12, move-in» зі статусом і «Your tasks: 0 of 2 done», без «Apartment 14, repair»",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-03" } },
  async ({ page }) => {
    const world = readWorld();
    const V = world.users.v;

    await given(
      `vendor V (${V.email}) who is the assignee of 2 tasks in the run "Apartment 12, move-in" and of no task in the run "Apartment 14, repair"`,
      async () => {
        const apt12 = await runTaskRows(world.runs.apt12.id);
        expect(apt12.filter((t) => t.assignee_id === V.id && t.status === "to_do")).toHaveLength(2);
        const apt14 = await runTaskRows(world.runs.apt14.id);
        expect(apt14.filter((t) => t.assignee_id === V.id)).toHaveLength(0);
      },
    );

    await when("V opens the list of runs", async () => {
      await page.goto("/runs");
      await expect(page.getByTestId("user-email")).toHaveText(V.email);
    });

    await thenStep(
      page,
      {
        clause:
          'V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair"',
        visible: [`the run «${CASE_APT12}»`, "its run status «in progress»", "«Your tasks: 0 of 2 done»"],
        hidden: [`only one run in the list (one row); «${CASE_APT14}» is nowhere on the page`],
      },
      async () => {
        const rows = page.getByTestId("run-row");
        await expect(rows).toHaveCount(1);
        await expect(rows.getByRole("link", { name: CASE_APT12, exact: true })).toBeVisible();
        await expect(rows.getByTestId("run-status")).toHaveText("in progress");
        await expect(rows.getByTestId("run-progress")).toHaveText("Your tasks: 0 of 2 done");
        await expect(page.getByText(CASE_APT14)).toHaveCount(0);
      },
    );
  },
);
