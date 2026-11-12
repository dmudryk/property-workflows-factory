// Ручне виправлення людини після розбору викладача 12.11 (та сама вада, що в основному репо, dmudryk/property-workflows#53):
// RLS фільтрує рядки, а не колонки — вендор запитом напряму отримував рядок свого запуску цілком (назва, версія й id
// шаблону, id менеджера). Тест — від імені вендора: що віддає база, а не що просить сторінка.
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { addVendor, moveInWithVendor, runTasks } from "./vendor-fixtures";

let t: TestDb;
let MANAGER_A: string;

beforeEach(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("vendor-access: запит напряму", () => {
  it("AC-VENDOR-04: напряму вендор отримує з таблиць runs і run_tasks 0 рядків, а з функцій — лише білий список колонок", async () => {
    const V = await addVendor(t);
    const runId = await moveInWithVendor(t, MANAGER_A, V);
    // Задачу вендора позначає менеджер A — у run_tasks.done_by тепер id менеджера.
    await t.asUser(MANAGER_A, "select public.mark_task_done($1)", [(await runTasks(t, runId))[2].id]);

    // Той самий запит, що з DevTools: GET /rest/v1/runs?select=* з токеном вендора.
    expect(await t.asUser(V, "select * from public.runs")).toEqual([]);
    expect(await t.asUser(V, "select * from public.run_tasks")).toEqual([]);

    const runs = await t.asUser<Record<string, unknown>>(V, "select * from public.vendor_runs()");
    expect(runs).toHaveLength(1);
    expect(Object.keys(runs[0]).sort()).toEqual(["case_name", "created_at", "id", "status"]);
    const tasks = await t.asUser<Record<string, unknown>>(V, "select * from public.vendor_tasks($1)", [runId]);
    expect(tasks).toHaveLength(2);
    expect(Object.keys(tasks[0]).sort()).toEqual(["id", "name", "position", "required", "run_id", "section_name", "status"]);
    const dump = JSON.stringify([runs, tasks]);
    expect(dump).not.toContain("Tenant move-in");
    expect(dump).not.toContain(MANAGER_A);
  }, 60_000);

  it("AC-VENDOR-06: функції вендора не віддають запуску, де в нього немає задач", async () => {
    const V = await addVendor(t);
    await moveInWithVendor(t, MANAGER_A, V);
    const [{ run_id: other }] = await t.asUser<{ run_id: string }>(
      MANAGER_A,
      "select public.launch_run('a1000000-0000-4000-8000-000000000002', 'Apartment 14, repair', '{}'::jsonb) as run_id",
    );

    expect((await t.asUser<{ id: string }>(V, "select id from public.vendor_runs()")).map((r) => r.id)).not.toContain(other);
    expect(await t.asUser(V, "select id from public.vendor_runs($1)", [other])).toEqual([]);
    expect(await t.asUser(V, "select id from public.vendor_tasks($1)", [other])).toEqual([]);
  }, 60_000);
});
