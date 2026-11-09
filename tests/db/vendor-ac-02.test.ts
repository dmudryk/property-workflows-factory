// AC-VENDOR-02 (openspec/specs/vendor-access, «Вендори у виборі виконавця»): вибір виконавця читає public.list_staff —
// правило (кого видно й які поля) живе в SQL. Тест бази на PGlite від імені менеджера A (asUser).
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { VENDOR_V_EMAIL, VENDOR_V_NAME, addVendor } from "./vendor-fixtures";

let t: TestDb;
let MANAGER_A: string;

beforeEach(async () => {
  t = await createTestDb();
  MANAGER_A = t.users["manager.a@example.test"];
}, 60_000);

describe("vendor-access", () => {
  it("AC-VENDOR-02: A відкриває вибір виконавця — email менеджера B, адміністратора й вендора V, без імен, ролей та інших даних профілю", async () => {
    await addVendor(t);

    const picker = await t.asUser<Record<string, unknown>>(MANAGER_A, "select * from public.list_staff()");

    expect(picker.map((row) => row.email)).toEqual(
      expect.arrayContaining(["manager.b@example.test", "admin@example.test", VENDOR_V_EMAIL]),
    );
    // Про кожного — лише email (і id, щоб передати вибір у launch_run): жодних full_name, role, created_at.
    expect([...new Set(picker.map((row) => Object.keys(row).sort().join(",")))]).toEqual(["email,id"]);
    const shown = JSON.stringify(picker);
    expect(shown).not.toContain(VENDOR_V_NAME);
    expect(shown).not.toContain("Менеджер B (демо)");
  }, 60_000);
});
