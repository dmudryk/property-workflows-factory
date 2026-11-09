// Спільні «Дано» для тестів бази зрізу 3 (openspec/specs/vendor-access, AC-VENDOR-01…10): вендор V, запуски
// «Apartment 12, move-in» і «Apartment 14, repair». Не тест (Vitest запускає лише *.test.ts) — помічники до
// tests/db/supabase-pglite.ts, наявних тестів і гарнесу не змінює.
import type { TestDb } from "./supabase-pglite";

export const TENANT_MOVE_IN = "a1000000-0000-4000-8000-000000000001"; // версія 1: 2 секції, 5 задач
export const REPAIR = "a1000000-0000-4000-8000-000000000002"; // версія 1: 2 секції, 3 задачі

// Задачі 1–5 версії 1 «Tenant move-in» (id — ті самі, що в зрізі 1; порядок — як у запуску):
// 1 «Sign the lease», 2 «Collect the deposit», 3 «Order cleaning» (Before move-in);
// 4 «Hand over the keys», 5 «Read the meters» (Move-in day).
export const MOVE_IN_TASK = [1, 2, 3, 4, 5].map((n) => `c1000000-0000-4000-8000-00000000000${n}`);

export const VENDOR_V_ID = "e0000000-0000-4000-8000-000000000001";
export const VENDOR_V_EMAIL = "vendor.v@example.test";
export const VENDOR_V_NAME = "Вендор V (демо)";

/**
 * Вендор V — як scripts/create-demo-users.mjs: користувач Auth → тригер on_auth_user_created створює профіль →
 * service_role ставить роль `vendor` (роль — лише з profiles.role). Доки ролі `vendor` немає в profiles_role_check,
 * падає саме тут — на «Дано».
 */
export async function addVendor(t: TestDb): Promise<string> {
  // Від імені власника бази (як Admin API): тригер створює профіль із роллю за замовчуванням.
  await t.db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
    VENDOR_V_ID,
    VENDOR_V_EMAIL,
    { full_name: VENDOR_V_NAME },
  ]);
  await t.asService("update public.profiles set role = 'vendor' where id = $1", [VENDOR_V_ID]);
  return VENDOR_V_ID;
}

/** Запуск шаблону від імені користувача через public.launch_run; assignments — {"<id задачі шаблону>": "<id виконавця>"}. */
export async function launch(
  t: TestDb,
  userId: string,
  templateId: string,
  caseName: string,
  assignments: Record<string, string> = {},
): Promise<string> {
  const [{ run_id }] = await t.asUser<{ run_id: string }>(
    userId,
    "select public.launch_run($1, $2, $3::jsonb) as run_id",
    [templateId, caseName, JSON.stringify(assignments)],
  );
  return run_id;
}

export type RunTaskRow = {
  id: string;
  name: string;
  section_name: string;
  required: boolean;
  position: number;
  assignee_id: string;
  status: string;
};

/** Задачі запуску в обхід RLS (service_role) — для підготовки й перевірки результату; у порядку запуску. */
export async function runTasks(t: TestDb, runId: string): Promise<RunTaskRow[]> {
  return t.asService<RunTaskRow>(
    `select id, name, section_name, required, position, assignee_id, status
     from public.run_tasks where run_id = $1 order by position`,
    [runId],
  );
}

/** «Apartment 12, move-in» від менеджера A: задачі 3 і 4 — вендору V, решта — A. */
export async function moveInWithVendor(t: TestDb, managerId: string, vendorId: string): Promise<string> {
  return launch(t, managerId, TENANT_MOVE_IN, "Apartment 12, move-in", {
    [MOVE_IN_TASK[2]]: vendorId,
    [MOVE_IN_TASK[3]]: vendorId,
  });
}
