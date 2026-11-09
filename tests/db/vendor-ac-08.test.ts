// AC-VENDOR-08 (openspec/specs/vendor-access, «Шаблони недоступні вендору»): які шаблони видно — правило в SQL (RLS на
// templates, template_versions, template_drafts), тож тест бази на PGlite від імені вендора V (asUser); що сторінка
// списку шаблонів показує вендору «Not enough rights» — чиста функція доступу з дослівним текстом AC.
import { beforeEach, describe, expect, it } from "vitest";
import * as roles from "@/lib/auth/roles";
import { MSG_NOT_ENOUGH_RIGHTS } from "@/lib/templates/content";
import { createTestDb, type TestDb } from "./supabase-pglite";
import { TENANT_MOVE_IN, addVendor } from "./vendor-fixtures";

// Контракт задачі фабрики: canSeeTemplates ще немає в src/lib/auth/roles.ts, а ролі «vendor» — в Actor
// (src/lib/runs/rules.ts). Тип оголошено тут, щоб typecheck лишався зеленим до реалізації; до неї виклик падає з
// «canSeeTemplates is not a function». false — сторінка /templates показує «Not enough rights» і жодного шаблону.
type Actor = { id: string; role: "manager" | "admin" | "vendor" };
const { canSeeTemplates } = roles as typeof roles & { canSeeTemplates: (actor: Actor | null) => boolean };

describe("vendor-access: база", () => {
  let t: TestDb;
  let ADMIN: string;

  beforeEach(async () => {
    t = await createTestDb();
    ADMIN = t.users["admin@example.test"];
  }, 60_000);

  it("AC-VENDOR-08: V за прямим запитом не отримує жодного шаблону, версії чи незбережених змін", async () => {
    const V = await addVendor(t);
    // Шаблони є: «Tenant move-in» і «Repair» з версією 1; адміністратор має незбережені зміни «Tenant move-in».
    const [{ current_content }] = await t.asService<{ current_content: unknown }>(
      "select current_content from public.templates where id = $1",
      [TENANT_MOVE_IN],
    );
    await t.asUser(ADMIN, "select public.save_template_draft($1, $2)", [TENANT_MOVE_IN, current_content]);
    const [{ n }] = await t.asService<{ n: number }>("select count(*)::int as n from public.templates");
    expect(n).toBe(2);

    expect(await t.asUser(V, "select id, name from public.templates")).toEqual([]);
    expect(await t.asUser(V, "select template_id from public.template_versions")).toEqual([]);
    expect(await t.asUser(V, "select template_id from public.template_drafts")).toEqual([]);
  }, 60_000);
});

describe("vendor-access: сторінка списку шаблонів", () => {
  it("AC-VENDOR-08: вендору на /templates — «Not enough rights» замість списку; менеджер і адміністратор список бачать", () => {
    expect(canSeeTemplates({ id: "vendor-v", role: "vendor" })).toBe(false);
    expect(MSG_NOT_ENOUGH_RIGHTS).toBe("Not enough rights");
    // Інший край: ролі, яким матриця прав дає «See templates» (AC-EDITOR-02, AC-EDITOR-17), список і далі бачать.
    expect(canSeeTemplates({ id: "manager-a", role: "manager" })).toBe(true);
    expect(canSeeTemplates({ id: "admin", role: "admin" })).toBe(true);
  });
});
