// AC-VENDOR-09 — відмова напряму, оминаючи сторінки: вендор V надсилає «запустити шаблон» прямо в Data API Supabase
// (public.launch_run зі своїм токеном). Правило живе в базі (private.launch_run) — його доводить
// tests/db/vendor.test.ts (SQL-мутант V8); тут — виняток WS8: запит напряму і крок, що показує на екрані «що не
// змінилося» — список запусків V до й після. «Дано» — синтетичний світ (@writes: vendor-world.setup.ts /
// cleanup.teardown.ts). Сторінку /runs/new вендору не показують узагалі («Not enough rights»), тож запит — лише напряму.
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { CASE_APT12, TEMPLATE_NAME, authFile, directRpc, readWorld, runsCount, templateVersion } from "./support/vendor-world";

test.use({ storageState: authFile("v") });

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-09: вендор V напряму запускає «Tenant move-in» — запуску не створено, список запусків не змінився",
  { tag: ["@uat", "@writes"], annotation: { type: "ac", description: "AC-VENDOR-09" } },
  async ({ page }) => {
    const world = readWorld();
    const V = world.users.v;
    const rows = page.getByTestId("run-row");
    // Список «до»: назви випадків і записи «Your tasks: N of K done» рядків (textContent — так само звіряє toHaveText).
    let before = { cases: [] as string[], progress: [] as string[] };
    let response: Awaited<ReturnType<typeof directRpc>> | null = null;

    await given(`vendor V (${V.email}) signed in and the template "Tenant move-in" with current version 1`, async () => {
      expect(await templateVersion(world.template.id)).toBe(1);
      await page.goto("/runs");
      await expect(page.getByTestId("user-email")).toHaveText(V.email);
      await expect(rows).toHaveCount(1);
      before = {
        cases: await rows.getByRole("link").allTextContents(),
        progress: await rows.getByTestId("run-progress").allTextContents(),
      };
    });

    await when("V tries to launch this template directly, bypassing the pages of the application", async () => {
      response = await directRpc(world.vendorAccessToken, "launch_run", {
        p_template_id: world.template.id,
        p_case_name: CASE_APT12,
        p_assignments: {},
      });
    });

    await thenStep(
      page,
      {
        clause: "no run is created, and the list of runs does not change",
        visible: [`the list of runs still shows only «${CASE_APT12}» with «Your tasks: 0 of 2 done»`],
        hidden: [
          `V's direct request to launch «${TEMPLATE_NAME}» was refused: HTTP 403, code 42501, NOT_ALLOWED`,
          "no run is created: in the database no run has V as the run manager (a run launched by V would have V as its run manager)",
          "the list of runs after reloading has the same rows as before the request",
        ],
      },
      async () => {
        await page.reload();
        await expect(rows).toHaveCount(1);
        await expect(rows.getByRole("link", { name: CASE_APT12, exact: true })).toBeVisible();
        await expect(rows.getByTestId("run-progress")).toHaveText("Your tasks: 0 of 2 done");
        await expect(rows.getByRole("link")).toHaveText(before.cases);
        await expect(rows.getByTestId("run-progress")).toHaveText(before.progress);
        expect(response).toMatchObject({ status: 403, code: "42501", message: "NOT_ALLOWED" });
        // Запуск вендора мав би менеджером запуску саме V — тож «запуску не створено» доводить ця перевірка
        // (лічильник усіх запусків на спільному проді крихкий: PM може саме тоді щось запустити).
        expect(await runsCount({ managerId: V.id })).toBe(0);
      },
    );
  },
);
