// Проєкт setup (без запису: тут вводяться паролі): синтетичний світ зрізу 3 для специфікацій @writes вендора —
// див. support/vendor-world.ts. Кроки: користувачі uat-<прогін>-<ключ>@example.test з ролями (як npm run users:demo:
// Admin API + роль у profiles) → менеджер A запускає «Tenant move-in» тією самою функцією бази, що й форма запуску
// (public.launch_run), → кожен, хто відкриває сторінки, входить через форму /login → стан сесії й світ — у
// playwright/.auth/ (у .gitignore). Прибирання — cleanup.teardown.ts (усі uat-*, їхні запуски й задачі).
// Без SUPABASE_SECRET_KEY світу немає (тесту не реєструємо, як cleanup.teardown.ts): тоді прогін лише AC, що нічого
// не пишуть — --grep-invert '@writes'.
import { expect, test as setup } from "@playwright/test";
import { hasAdminKey } from "./support/admin";
import { signIn } from "./support/uat";
import {
  CASE_APT12,
  CASE_APT14,
  TEMPLATE_NAME,
  WORLD_ROLES,
  authFile,
  createWorldUser,
  launchAs,
  signInApi,
  templateFor,
  writeWorld,
  type World,
  type WorldUserKey,
} from "./support/vendor-world";

const KEYS = Object.keys(WORLD_ROLES) as WorldUserKey[];
/** Хто відкриває сторінки в специфікаціях (v1 лише призначають у AC-VENDOR-01 — входити йому не треба). */
const SIGNED_IN: WorldUserKey[] = ["a", "v", "v5", "w"];
const RUN_ID = process.env.UAT_RUN ?? "manual";

if (hasAdminKey()) {
  setup("світ вендора: синтетичні менеджер A і вендори, запуски «Apartment 12, move-in» і «Apartment 14, repair»", async ({ browser }) => {
    // 1. Користувачі з ролями.
    const users = {} as World["users"];
    const passwords = {} as Record<WorldUserKey, string>;
    for (const key of KEYS) {
      const { email, id, password } = await createWorldUser(key);
      users[key] = { email, id };
      passwords[key] = password;
    }

    // 2. Шаблон «Tenant move-in» очима менеджера A: поточна версія й 5 задач (номери 1…5 — у порядку секцій).
    const { client: managerA } = await signInApi(users.a.email, passwords.a);
    const template = await templateFor(managerA, TEMPLATE_NAME);
    expect(template.tasks, `«${TEMPLATE_NAME}» на проді має 5 задач, як у «Дано» AC зрізу 3`).toHaveLength(5);

    // 3. Запуски світу від імені A; задачі 3 і 4 — вендору.
    const toVendor = (key: WorldUserKey) => ({
      [template.tasks[2].id]: users[key].id,
      [template.tasks[3].id]: users[key].id,
    });
    const runs = {
      apt12: await launchAs(managerA, template.id, CASE_APT12, toVendor("v")),
      apt14: await launchAs(managerA, template.id, CASE_APT14, {}),
      apt12v5: await launchAs(managerA, template.id, CASE_APT12, toVendor("v5")),
    };

    // 4. Вхід через форму /login для тих, хто відкриває сторінки; стан сесії — у playwright/.auth/uat_<ключ>.json.
    for (const key of SIGNED_IN) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await signIn(page, users[key].email, passwords[key]);
      await expect(page.getByTestId("user-email")).toHaveText(users[key].email);
      await context.storageState({ path: authFile(key) });
      await context.close();
    }

    // 5. Токен V для запитів напряму (AC-VENDOR-07, AC-VENDOR-09) і сам світ.
    const { accessToken } = await signInApi(users.v.email, passwords.v);
    writeWorld({ run: RUN_ID, template, users, runs, vendorAccessToken: accessToken });
  });
}
