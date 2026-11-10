// AC-VENDOR-03 (openspec/specs/vendor-access, «Список запусків вендора»): які запуски видно вендору — правило в SQL
// (RLS на runs і run_tasks), тож тест бази на PGlite від імені вендора V (asUser); запис «Your tasks: N of K done» —
// чиста функція з дослівним текстом AC.
import { beforeEach, describe, expect, it } from "vitest";
import * as rules from "@/lib/runs/rules";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { REPAIR, addVendor, launch, moveInWithVendor } from "./vendor-fixtures";

// Контракт задачі фабрики: yourTasksLabel ще немає в src/lib/runs/rules.ts. Тип оголошено тут, щоб typecheck лишався
// зеленим до реалізації; до неї виклик падає з «yourTasksLabel is not a function». Рахує лише задачі userId у цьому
// запуску (припущення PM): K — їх кількість, N — ті, що «done».
type YourTasksLabel = (tasks: readonly { assigneeId: string; status: string }[], userId: string) => string;
const { yourTasksLabel, runStatusLabel } = rules as typeof rules & { yourTasksLabel: YourTasksLabel };

describe("vendor-access: база", () => {
  let t: TestDb;
  let MANAGER_A: string;

  beforeEach(async () => {
    t = await createTestDb();
    MANAGER_A = t.users["manager.a@example.test"];
  }, 60_000);

  it("AC-VENDOR-03: V з 2 задачами в «Apartment 12, move-in» і жодною в «Apartment 14, repair» бачить лише перший запуск, «in progress», 0 із 2 своїх задач «done»", async () => {
    const V = await addVendor(t);
    const moveIn = await moveInWithVendor(t, MANAGER_A, V);
    await launch(t, MANAGER_A, REPAIR, "Apartment 14, repair");

    const runs = await t.asUser<{ id: string; case_name: string; status: string }>(
      V,
      "select id, case_name, status from public.runs order by created_at",
    );
    expect(runs.map((r) => [r.case_name, runStatusLabel(r.status)])).toEqual([["Apartment 12, move-in", "in progress"]]);
    expect(runs[0].id).toBe(moveIn);

    const [mine] = await t.asUser<{ done: number; total: number }>(
      V,
      `select count(*) filter (where status = 'done')::int as done, count(*)::int as total
       from public.run_tasks where run_id = $1 and assignee_id = $2`,
      [moveIn, V],
    );
    expect(mine).toEqual({ done: 0, total: 2 });
  }, 60_000);
});

describe("vendor-access: запис у списку запусків", () => {
  it("AC-VENDOR-03: «Your tasks: 0 of 2 done» — лише 2 задачі вендора V із 5 задач запуску, жодна не «done»", () => {
    const tasks = [
      { assigneeId: "manager-a", status: "to_do" },
      { assigneeId: "manager-a", status: "done" },
      { assigneeId: "vendor-v", status: "to_do" },
      { assigneeId: "vendor-v", status: "to_do" },
      { assigneeId: "manager-a", status: "done" },
    ];

    expect(yourTasksLabel(tasks, "vendor-v")).toBe("Your tasks: 0 of 2 done");
  });
});
