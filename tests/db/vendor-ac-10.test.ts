// AC-VENDOR-10 (openspec/specs/vendor-access, «Порожній список запусків вендора»): які запуски видно — правило в SQL
// (RLS на runs), тож тест бази на PGlite від імені вендора V (asUser); порожній стан списку для вендора — чиста функція
// з дослівним текстом AC.
import { beforeEach, describe, expect, it } from "vitest";
import * as listView from "@/lib/runs/list-view";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { REPAIR, TENANT_MOVE_IN, addVendor, launch } from "./vendor-fixtures";

// Контракт задачі фабрики: runsEmptyState ще немає в src/lib/runs/list-view.ts (за зразком templatesEmptyState у
// src/lib/templates/empty-states.ts). Тип оголошено тут, щоб typecheck лишався зеленим до реалізації; до неї виклик
// падає з «runsEmptyState is not a function». vendor = true — порожній список запусків вендора.
type EmptyState = { message: string; action?: { href: string; label: string } };
const { runsEmptyState, runsListView } = listView as typeof listView & {
  runsEmptyState: (vendor: boolean) => EmptyState;
};

describe("vendor-access: база", () => {
  let t: TestDb;
  let MANAGER_A: string;

  beforeEach(async () => {
    t = await createTestDb();
    MANAGER_A = t.users["manager.a@example.test"];
  }, 60_000);

  it("AC-VENDOR-10: V без жодної задачі відкриває список запусків — жодного запуску, хоч запуски агенції є", async () => {
    const V = await addVendor(t);
    await launch(t, MANAGER_A, TENANT_MOVE_IN, "Apartment 12, move-in");
    await launch(t, MANAGER_A, REPAIR, "Apartment 14, repair");
    const [{ n }] = await t.asService<{ n: number }>("select count(*)::int as n from public.runs");
    expect(n).toBe(2);

    const runs = await t.asUser(V, "select id, case_name from public.runs");
    expect(runs).toEqual([]);
    expect(runsListView(runs.length)).toBe("empty"); // без таблиці (AC-DSYS-04, DESIGN.md, розділ 6)
  }, 60_000);
});

describe("vendor-access: порожній стан списку запусків", () => {
  it("AC-VENDOR-10: вендору без задач — «No tasks assigned to you yet.» замість порожньої таблиці", () => {
    expect(runsListView(0)).toBe("empty");
    expect(runsEmptyState(true).message).toBe("No tasks assigned to you yet.");
    // Інший край: менеджер без запусків і далі бачить текст AC-DSYS-04.
    expect(runsEmptyState(false).message).toBe("No runs yet. Launch a template to start one.");
  });
});
