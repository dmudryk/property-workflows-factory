// AC-VENDOR-04 (openspec/specs/vendor-access, «Вендор бачить у запуску лише свої задачі»): які задачі й чиї email
// видно вендору — правило в SQL (RLS на run_tasks і profiles, public.list_staff). Тест бази на PGlite від імені V.
import { beforeEach, describe, expect, it } from "vitest";
import { requiredLabel, taskStatusLabel } from "@/lib/runs/rules";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { VENDOR_V_EMAIL, addVendor, moveInWithVendor } from "./vendor-fixtures";

let t: TestDb;
let MANAGER_A: string;

beforeEach(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("vendor-access", () => {
  it("AC-VENDOR-04: V відкриває «Apartment 12, move-in» — рівно задачі 3 і 4 з назвою, секцією, «required»/«optional» і статусом; без задач 1, 2, 5, чужих email і прогресу всього запуску", async () => {
    const V = await addVendor(t);
    const runId = await moveInWithVendor(t, MANAGER_A, V);

    const seen = await t.asUser<{ name: string; section_name: string; required: boolean; status: string }>(
      V,
      "select name, section_name, required, status from public.run_tasks where run_id = $1 order by position",
      [runId],
    );
    expect(seen.map((task) => [task.name, task.section_name, requiredLabel(task.required), taskStatusLabel(task.status)])).toEqual([
      ["Order cleaning", "Before move-in", "optional", "to do"],
      ["Hand over the keys", "Move-in day", "required", "to do"],
    ]);

    // Прогрес усього запуску («N of 5») порахувати нема з чого: з 5 задач запуску V доступні лише 2 його.
    const [{ total }] = await t.asUser<{ total: number }>(
      V,
      "select count(*)::int as total from public.run_tasks where run_id = $1",
      [runId],
    );
    expect(total).toBe(2);

    // Email інших користувачів: ні з вибору виконавця, ні з профілів.
    const staff = await t.asUser<{ email: string }>(V, "select email from public.list_staff()");
    expect(staff.map((s) => s.email).filter((email) => email !== VENDOR_V_EMAIL)).toEqual([]);
    const profiles = await t.asUser<{ email: string }>(V, "select email from public.profiles");
    expect(profiles.map((p) => p.email)).toEqual([VENDOR_V_EMAIL]);
  }, 60_000);
});
