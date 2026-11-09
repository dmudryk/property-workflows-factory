// AC-VENDOR-01 (openspec/specs/vendor-access, «Призначення вендора під час запуску»): правило живе в SQL —
// public.launch_run приймає вендора виконавцем. Тест бази на PGlite від імені менеджера A (asUser).
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
  it("AC-VENDOR-01: A призначає вендора V на задачі 3 і 4 «Tenant move-in» — у задач 3 і 4 виконавець V, у задач 1, 2 і 5 — A", async () => {
    const V = await addVendor(t);

    const runId = await moveInWithVendor(t, MANAGER_A, V);

    const tasks = await runTasks(t, runId);
    expect(tasks).toHaveLength(5);
    expect(tasks.map((task) => task.assignee_id)).toEqual([MANAGER_A, MANAGER_A, V, V, MANAGER_A]);
  }, 60_000);
});
