// AC-VENDOR-05 (openspec/specs/vendor-access, «Вендор позначає свою задачу»): позначку робить public.mark_task_done —
// правило в SQL, тож тест бази на PGlite від імені вендора V (asUser); запис «Your tasks: N of K done» — чиста функція з
// дослівним текстом AC.
import { beforeEach, describe, expect, it } from "vitest";
import * as rules from "@/lib/runs/rules";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { addVendor, moveInWithVendor, runTasks } from "./vendor-fixtures";

// Контракт задачі фабрики: yourTasksLabel ще немає в src/lib/runs/rules.ts. Тип оголошено тут, щоб typecheck лишався
// зеленим до реалізації; до неї виклик падає з «yourTasksLabel is not a function». Рахує лише задачі userId у цьому
// запуску (припущення PM): K — їх кількість, N — ті, що «done».
type YourTasksLabel = (tasks: readonly { assigneeId: string; status: string }[], userId: string) => string;
const { yourTasksLabel } = rules as typeof rules & { yourTasksLabel: YourTasksLabel };

describe("vendor-access: база", () => {
  let t: TestDb;
  let MANAGER_A: string;

  beforeEach(async () => {
    t = await createTestDb();
    MANAGER_A = t.users["manager.a@example.test"];
  }, 60_000);

  it("AC-VENDOR-05: V позначає свою задачу 3 «to do» (не останню обов'язкову) — задача 3 «done», у V 1 із 2 його задач «done»", async () => {
    const V = await addVendor(t);
    const runId = await moveInWithVendor(t, MANAGER_A, V);
    const task3 = (await runTasks(t, runId))[2];
    expect([task3.name, task3.required, task3.status]).toEqual(["Order cleaning", false, "to_do"]);

    await t.asUser(V, "select public.mark_task_done($1)", [task3.id]);

    expect((await runTasks(t, runId))[2].status).toBe("done");
    const mine = await t.asUser<{ status: string }>(
      V,
      "select status from public.vendor_tasks($1) order by position",
      [runId],
    );
    expect(mine.map((task) => task.status)).toEqual(["done", "to_do"]);
  }, 60_000);
});

describe("vendor-access: запис після позначки", () => {
  it("AC-VENDOR-05: «Your tasks: 1 of 2 done» — задача 3 вендора V «done», задача 4 «to do»", () => {
    const tasks = [
      { assigneeId: "manager-a", status: "to_do" },
      { assigneeId: "manager-a", status: "to_do" },
      { assigneeId: "vendor-v", status: "done" },
      { assigneeId: "vendor-v", status: "to_do" },
      { assigneeId: "manager-a", status: "to_do" },
    ];

    expect(yourTasksLabel(tasks, "vendor-v")).toBe("Your tasks: 1 of 2 done");
  });
});
