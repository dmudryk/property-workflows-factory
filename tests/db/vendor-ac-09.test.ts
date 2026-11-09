// AC-VENDOR-09 (openspec/specs/vendor-access, «Вендор не запускає шаблон»): право запуску перевіряє SQL
// (private.launch_run, без грантів на запис у runs і run_tasks). Тест бази на PGlite: запит напряму від імені
// вендора V (asUser), список запусків до й після — в обхід RLS (asService) і очима V.
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { TENANT_MOVE_IN, addVendor, moveInWithVendor } from "./vendor-fixtures";

let t: TestDb;
let MANAGER_A: string;

beforeEach(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

const allRuns = () => t.asService<{ id: string }>("select id from public.runs order by id");
const allRunTasks = () => t.asService<{ n: number }>("select count(*)::int as n from public.run_tasks");

describe("vendor-access", () => {
  it("AC-VENDOR-09: V напряму запускає «Tenant move-in» (поточна версія 1) — запуску не створено, список запусків не змінився", async () => {
    const V = await addVendor(t);
    await moveInWithVendor(t, MANAGER_A, V); // список запусків не порожній: V бачить свій запуск
    const [{ current_version }] = await t.asService<{ current_version: number }>(
      "select current_version from public.templates where id = $1",
      [TENANT_MOVE_IN],
    );
    expect(current_version).toBe(1);
    const before = await allRuns();
    const tasksBefore = await allRunTasks();
    const seenBefore = await t.asUser(V, "select id from public.runs order by id");

    await expect(
      t.asUser(V, "select public.launch_run($1, 'Apartment 12, move-in', '{}'::jsonb)", [TENANT_MOVE_IN]),
    ).rejects.toThrow(/NOT_ALLOWED/);
    await expect(
      t.asUser(
        V,
        `insert into public.runs (template_id, template_version, template_name, case_name, manager_id)
         values ($1, 1, 'Tenant move-in', 'Apartment 12, move-in', $2)`,
        [TENANT_MOVE_IN, V],
      ),
    ).rejects.toThrow(/permission denied/);

    expect(await allRuns()).toEqual(before);
    expect(await allRunTasks()).toEqual(tasksBefore);
    expect(await t.asUser(V, "select id from public.runs order by id")).toEqual(seenBefore);
  }, 60_000);
});
