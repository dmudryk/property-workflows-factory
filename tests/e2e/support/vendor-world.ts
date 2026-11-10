// Синтетичний «світ» зрізу 3 для UAT на проді (openspec/specs/vendor-access): менеджер A, вендори й запуски
// «Apartment 12, move-in» / «Apartment 14, repair» — лише uat-<прогін>-<ключ>@example.test. Так «Дано» кожного AC
// не залежить від того, що PM чи інший прогін зробили зі спільними акаунтами, а прод після прогону — такий, як був.
// Створює vendor-world.setup.ts (проєкт setup, без запису: там вводяться паролі), прибирає cleanup.teardown.ts
// (deleteUatUsers з OWNED_ROWS у support/admin.ts: спершу запуски й задачі синтетичних користувачів, потім вони самі).
// Специфікації читають світ з файлу в playwright/.auth/ (у .gitignore): адреси, id запусків і задач, токен V для
// запиту «напряму, оминаючи сторінки». Значень паролів і токенів ніде не друкуємо.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient, randomPassword, uatEmail } from "./admin";

export const WORLD_FILE = "playwright/.auth/uat-vendor-world.json";
export const TEMPLATE_NAME = "Tenant move-in";
export const CASE_APT12 = "Apartment 12, move-in";
export const CASE_APT14 = "Apartment 14, repair";

/**
 * a — менеджер A (менеджер запуску всіх запусків світу); v — вендор V: задачі 3 і 4 в «Apartment 12, move-in», жодної
 * в «Apartment 14, repair» (AC-VENDOR-03, 04, 06, 07, 09); v1 — вендор, якого A призначає під час запуску (AC-VENDOR-01);
 * v5 — вендор зі своїм запуском, який позначає задачу 3 (AC-VENDOR-05); w — вендор без жодної задачі (AC-VENDOR-10).
 * Окремі вендори — щоб AC, що змінюють дані (01, 05), не міняли «Дано» інших AC, хоч би в якому порядку йшли файли.
 */
export const WORLD_ROLES = { a: "manager", v: "vendor", v1: "vendor", v5: "vendor", w: "vendor" } as const;
export type WorldUserKey = keyof typeof WORLD_ROLES;

/** Задача шаблону; номер задачі з AC — її місце в порядку секцій (1…5). */
export type WorldTask = { id: string; name: string; section: string; required: boolean };
/** Запуск світу: id задач у тому самому порядку (за position), що й задачі шаблону. */
export type WorldRun = { id: string; taskIds: string[] };

export type World = {
  run: string;
  template: { id: string; version: number; tasks: WorldTask[] };
  users: Record<WorldUserKey, { email: string; id: string }>;
  runs: { apt12: WorldRun; apt14: WorldRun; apt12v5: WorldRun };
  /** Токен доступу V (Supabase Auth, ~1 год) — лише для запитів напряму в AC-VENDOR-07 і AC-VENDOR-09. */
  vendorAccessToken: string;
};

export const authFile = (key: WorldUserKey) => `playwright/.auth/uat_${key}.json`;

// ── Побудова світу (лише vendor-world.setup.ts) ──

/** Синтетичний користувач з роллю: Admin API + роль у profiles (колонку role змінює лише service_role), як npm run users:demo. */
export async function createWorldUser(key: WorldUserKey) {
  const admin = adminClient();
  const email = uatEmail(key);
  const password = randomPassword();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, email, role: WORLD_ROLES[key] }, { onConflict: "id" });
  if (profileError) throw profileError;
  return { email, id: data.user.id, password };
}

/** Вхід через Supabase Auth з публічним ключем — клієнт від імені користувача і його токен доступу. */
export async function signInApi(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Немає NEXT_PUBLIC_SUPABASE_URL чи NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local)");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, accessToken: data.session.access_token };
}

type TemplateContent = { sections: { name: string; tasks: { id: string; name: string; required: boolean }[] }[] };

/** Шаблон очима менеджера (RLS: лише збережені версії): id, поточна версія, задачі 1…5 у порядку секцій. */
export async function templateFor(manager: SupabaseClient, name: string): Promise<World["template"]> {
  const { data, error } = await manager
    .from("templates")
    .select("id, current_version, current_content")
    .eq("name", name)
    .single();
  if (error) throw error;
  const content = data.current_content as TemplateContent;
  const tasks = content.sections.flatMap((section) =>
    section.tasks.map((task) => ({ id: task.id, name: task.name, section: section.name, required: task.required })),
  );
  return { id: data.id as string, version: data.current_version as number, tasks };
}

/** Запуск від імені менеджера тією самою функцією бази, що й форма запуску (public.launch_run). */
export async function launchAs(
  manager: SupabaseClient,
  templateId: string,
  caseName: string,
  assignments: Record<string, string>,
): Promise<WorldRun> {
  const { data: runId, error } = await manager.rpc("launch_run", {
    p_template_id: templateId,
    p_case_name: caseName,
    p_assignments: assignments,
  });
  if (error) throw error;
  const rows = await runTaskRows(runId as string);
  return { id: runId as string, taskIds: rows.map((row) => row.id) };
}

/** Файл містить живий токен V (~1 год), тож права — лише власнику (0600; у Windows діють ACL теки користувача). */
export function writeWorld(world: World) {
  mkdirSync(path.dirname(WORLD_FILE), { recursive: true, mode: 0o700 });
  writeFileSync(WORLD_FILE, JSON.stringify(world, null, 2), { mode: 0o600 });
}

export function readWorld(): World {
  return JSON.parse(readFileSync(WORLD_FILE, "utf8")) as World;
}

/**
 * Запит «напряму, оминаючи сторінки застосунку»: виклик функції бази через Data API Supabase з власним токеном
 * користувача й публічним ключем — так само його надіслав би будь-хто з входом. Node fetch, а не браузер: запиту немає
 * ні у відео, ні в трасі, тож токен туди не потрапляє.
 */
export async function directRpc(token: string, fn: string, args: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Для запиту напряму потрібні NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local)");
  }
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  // Сире тіло — для діагностики, якщо відповідь не JSON (наприклад, 502 від проксі); токена в ньому немає.
  const raw = await res.text();
  let body: { code?: string; message?: string } | null = null;
  try {
    body = JSON.parse(raw) as { code?: string; message?: string };
  } catch {
    body = null;
  }
  return { status: res.status, code: body?.code ?? null, message: body?.message ?? null, raw: raw.slice(0, 300) };
}

// Перевірки «що не змінилося» в базі (секретним ключем, в обхід RLS) — лише читання.

export async function taskRow(taskId: string) {
  const { data, error } = await adminClient()
    .from("run_tasks")
    .select("status, assignee_id, done_by")
    .eq("id", taskId)
    .single();
  if (error) throw error;
  return data as { status: string; assignee_id: string; done_by: string | null };
}

/** Задачі запуску в порядку position: виконавець і статус кожної. */
export async function runTaskRows(runId: string) {
  const { data, error } = await adminClient()
    .from("run_tasks")
    .select("id, assignee_id, status")
    .eq("run_id", runId)
    .order("position");
  if (error) throw error;
  return (data ?? []) as { id: string; assignee_id: string; status: string }[];
}

/** Скільки задач (у будь-яких запусках) призначено користувачу. */
export async function tasksAssignedTo(userId: string) {
  const { count, error } = await adminClient()
    .from("run_tasks")
    .select("*", { count: "exact", head: true })
    .eq("assignee_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function runManager(runId: string) {
  const { data, error } = await adminClient().from("runs").select("manager_id").eq("id", runId).single();
  if (error) throw error;
  return (data as { manager_id: string }).manager_id;
}

export async function runsCount(filter?: { managerId: string }) {
  let query = adminClient().from("runs").select("*", { count: "exact", head: true });
  if (filter) query = query.eq("manager_id", filter.managerId);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function templateVersion(templateId: string) {
  const { data, error } = await adminClient().from("templates").select("current_version").eq("id", templateId).single();
  if (error) throw error;
  return (data as { current_version: number | null }).current_version;
}
