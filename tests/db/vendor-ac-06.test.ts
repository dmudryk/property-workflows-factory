// AC-VENDOR-06 (openspec/specs/vendor-access, «Чужий запуск для вендора»): чи бачить вендор запуск — правило в SQL
// (RLS на runs і run_tasks). Тест бази на PGlite від імені вендора V (asUser): запуску немає — сторінка запуску
// показує MSG_RUN_NOT_FOUND (src/app/runs/[id]/page.tsx, як для AC-TASK-10).
import { beforeEach, describe, expect, it } from "vitest";
import { MSG_RUN_NOT_FOUND } from "@/lib/runs/rules";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { REPAIR, addVendor, launch, moveInWithVendor, runTasks } from "./vendor-fixtures";

let t: TestDb;
let MANAGER_A: string;

beforeEach(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("vendor-access", () => {
  it("AC-VENDOR-06: V відкриває за прямим посиланням «Apartment 14, repair», де не має задач, — «Run not found» і жодної задачі запуску", async () => {
    const V = await addVendor(t);
    await moveInWithVendor(t, MANAGER_A, V); // у V є задачі, але в іншому запуску
    const repair = await launch(t, MANAGER_A, REPAIR, "Apartment 14, repair");
    expect(await runTasks(t, repair)).toHaveLength(3); // задачі в запуску є — просто не для V

    const run = await t.asUser(V, "select id, case_name from public.runs where id = $1", [repair]);
    expect(run).toEqual([]);
    expect(MSG_RUN_NOT_FOUND).toBe("Run not found");

    const tasks = await t.asUser(V, "select id, name from public.run_tasks where run_id = $1", [repair]);
    expect(tasks).toEqual([]);
  }, 60_000);
});
