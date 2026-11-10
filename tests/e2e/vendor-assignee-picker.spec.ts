// AC-VENDOR-02 — вибір виконавця під час запуску показує email менеджерів, адміністратора й вендора, без імен і ролей.
// Лише читання: форму запуску відкрито, але не надіслано. Акаунти — ті самі, що в accounts.zip для PM:
// A — manager.a@example.test, B — manager.b@example.test, адміністратор — admin@example.test, V — vendor@example.test.
// Імена в профілях цих акаунтів (supabase/demo-users.json) — саме те, чого в списку бути не має. Список довгий
// (на проді є й інші акаунти, а під час прогону — синтетичні uat-…), тож вікно вище, щоб пункти вмістились на кадрі.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { attachRuntimeErrors, given, thenStep, when } from "./support/uat";
import { TEMPLATE_NAME } from "./support/vendor-world";

test.use({ storageState: "playwright/.auth/manager_a.json", viewport: { width: 1280, height: 1200 } });

const A = "manager.a@example.test";
const SEEN = ["manager.b@example.test", "admin@example.test", "vendor@example.test"];
const DEMO_USERS = JSON.parse(readFileSync("supabase/demo-users.json", "utf8")) as { email: string; full_name: string }[];
const NAMES = DEMO_USERS.filter((u) => SEEN.includes(u.email)).map((u) => u.full_name);
const SELF = "Me (run manager)";

test.afterEach(async ({ page }) => attachRuntimeErrors(page));

test(
  "AC-VENDOR-02: менеджер A відкриває вибір виконавця — email B, адміністратора й V, без імен, ролей і інших даних профілю",
  { tag: ["@uat"], annotation: { type: "ac", description: "AC-VENDOR-02" } },
  async ({ page }) => {
    await given(
      `managers A (${A}) and B (${SEEN[0]}), an administrator (${SEEN[1]}) and vendor V (${SEEN[2]}), and A launching a template`,
      async () => {
        await page.goto("/runs/new");
        await expect(page.getByTestId("user-email")).toHaveText(A);
        await page.getByRole("combobox", { name: "Template" }).click();
        await page.getByRole("option", { name: TEMPLATE_NAME, exact: true }).click();
        await page.waitForURL((url) => url.searchParams.has("template"));
        await expect(page.getByRole("heading", { level: 2, name: "Assignees" })).toBeVisible();
      },
    );

    await when("A opens the assignee picker", async () => {
      // Вибір виконавця першої задачі шаблону (за її підписом у кроці «Assignees»): найвищий список на сторінці —
      // під ним найбільше місця для пунктів. Назву беремо зі сторінки: акаунти спільні, синтетичного світу тут немає.
      // Підписи списків виконавця — <label for="assignee-…"> (fieldset є й у перемикача теми, тож шукаємо саме їх).
      const firstTask = (await page.locator('label[for^="assignee-"]').first().textContent())?.trim() ?? "";
      expect(firstTask).not.toBe("");
      await page.getByRole("combobox", { name: firstTask }).click();
      await expect(page.getByRole("listbox")).toBeVisible();
    });

    await thenStep(
      page,
      {
        clause: "A sees the emails of B, of the administrator and of V, and no names, roles or other profile data",
        visible: SEEN.map((email) => `the email ${email} in the open list`),
        hidden: [
          `no names, roles or other profile data: every item of the list is exactly one email address, except «${SELF}» (the run manager, A)`,
          `none of the profile names of B, the administrator and V (${NAMES.join(", ")}) is on the page`,
        ],
      },
      async () => {
        const options = page.getByRole("listbox").getByRole("option");
        const labels = (await options.allInnerTexts()).map((label) => label.trim());
        expect(labels).toEqual(expect.arrayContaining([SELF, ...SEEN]));
        for (const email of SEEN) {
          await expect(page.getByRole("option", { name: email, exact: true })).toBeInViewport();
        }
        expect(labels.filter((label) => label !== SELF).every((label) => /^[\w.+-]+@example\.test$/.test(label))).toBe(true);
        expect(NAMES).toHaveLength(3);
        const body = await page.locator("body").innerText();
        for (const name of NAMES) expect(body).not.toContain(name);
      },
    );
  },
);
