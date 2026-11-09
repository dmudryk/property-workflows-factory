// AC-VENDOR-07 (openspec/specs/vendor-access, «Вендор не позначає чужу задачу»): позначку перевіряє SQL
// (private.mark_task_done, без грантів на запис у run_tasks). Тест бази на PGlite: запит напряму від імені вендора V
// (asUser), результат — в обхід RLS (asService).
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { addVendor, moveInWithVendor, runTasks } from "./vendor-fixtures";

let t: TestDb;
let MANAGER_A: string;

beforeEach(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("vendor-access", () => {
  it("AC-VENDOR-07: V напряму позначає задачу 1 менеджера A в «Apartment 12, move-in» — відмова, задача 1 лишається «to do»", async () => {
    const V = await addVendor(t);
    const runId = await moveInWithVendor(t, MANAGER_A, V);
    const task1 = (await runTasks(t, runId))[0];
    expect([task1.assignee_id, task1.status]).toEqual([MANAGER_A, "to_do"]);

    await expect(t.asUser(V, "select public.mark_task_done($1)", [task1.id])).rejects.toThrow(/NOT_ALLOWED/);
    await expect(
      t.asUser(V, "update public.run_tasks set status = 'done', done_by = $2, done_at = now() where id = $1", [task1.id, V]),
    ).rejects.toThrow(/permission denied/);

    const after = (await runTasks(t, runId))[0];
    expect(after.status).toBe("to_do");
  }, 60_000);
});
