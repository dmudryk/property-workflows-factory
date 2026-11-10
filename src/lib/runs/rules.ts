// Правила зрізу WS6 (openspec/specs/workflow-runs, openspec/specs/run-tasks) — чисті функції без бази.
// Server actions викликають їх до звернення до Supabase; ті самі права й обмеження дублює база (RLS, check, функції).

export type Role = "manager" | "admin" | "vendor";

export type Actor = { id: string; role: Role };

export const CASE_NAME_MAX = 100;
export const MSG_EMPTY_CASE_NAME = "Enter a case name";
export const MSG_CASE_NAME_TOO_LONG = "Case name must be at most 100 characters";

export type CaseNameResult = { ok: true; value: string } | { ok: false; error: string };

// AC-RUN-03, AC-RUN-07, AC-RUN-11. Пробіли на початку й у кінці обрізаються до перевірки й збереження (припущення
// PM від 2026-10-20); довжину рахуємо в символах Unicode.
export function validateCaseName(raw: string): CaseNameResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, error: MSG_EMPTY_CASE_NAME };
  if (Array.from(trimmed).length > CASE_NAME_MAX) return { ok: false, error: MSG_CASE_NAME_TOO_LONG };
  return { ok: true, value: trimmed };
}

// AC-RUN-10, AC-TASK-11: про співробітника показуємо лише email — без імені й ролі.
export function staffLabel(member: { email: string | null } | undefined): string {
  return member?.email ?? "—";
}

// AC-RUN-12, AC-TASK-12: задачі групами за секціями, у порядку позиції (знімок секцій на момент запуску).
export function groupBySection<T extends { sectionName: string; position: number }>(
  tasks: readonly T[],
): { name: string; tasks: T[] }[] {
  const groups: { name: string; tasks: T[] }[] = [];
  for (const task of tasks.toSorted((a, b) => a.position - b.position)) {
    const last = groups.at(-1);
    if (last && last.name === task.sectionName) last.tasks.push(task);
    else groups.push({ name: task.sectionName, tasks: [task] });
  }
  return groups;
}

export type TemplateTask = {
  id: string;
  sectionName: string;
  name: string;
  required: boolean;
  position: number;
};

export type PlannedRunTask = {
  templateTaskId: string;
  sectionName: string;
  name: string;
  required: boolean;
  position: number;
  assigneeId: string;
  status: "to_do";
};

export type PlannedRun = {
  managerId: string;
  caseName: string;
  status: "in_progress";
  tasks: PlannedRunTask[];
};

// AC-RUN-01, AC-RUN-02, AC-RUN-04, AC-RUN-05, AC-RUN-06, AC-RUN-08, AC-RUN-09.
// Запуск — копія задач шаблону (знімок): менеджер запуску — той, хто запускає; виконавець задачі — призначений
// користувач або менеджер запуску.
export function planRun(
  actor: Actor,
  caseName: string,
  templateTasks: readonly TemplateTask[],
  assignments: Readonly<Record<string, string>> = {},
): { ok: true; run: PlannedRun } | { ok: false; error: string } {
  const name = validateCaseName(caseName);
  if (!name.ok) return name;
  return {
    ok: true,
    run: {
      managerId: actor.id,
      caseName: name.value,
      status: "in_progress",
      tasks: templateTasks.map((t) => ({
        templateTaskId: t.id,
        sectionName: t.sectionName,
        name: t.name,
        required: t.required,
        position: t.position,
        assigneeId: assignments[t.id] || actor.id,
        status: "to_do",
      })),
    },
  };
}

// ── Задача 2: позначка «done», завершення запуску, прогрес і видимість (openspec/specs/run-tasks) ──

export const MSG_NOT_ALLOWED_TO_MARK =
  "Only the task's assignee, the run manager, or an administrator can mark a task as done";

export type TaskStatus = "to_do" | "done";
export type RunStatus = "in_progress" | "completed";

export type RunTask = { id: string; assigneeId: string; required: boolean; status: TaskStatus };
export type Run = { id: string; managerId: string; status: RunStatus; tasks: RunTask[] };

// AC-TASK-01, AC-TASK-02, AC-TASK-03, AC-TASK-07: виконавець задачі, менеджер її запуску або адміністратор.
export function canMarkDone(actor: Actor, run: Pick<Run, "managerId">, task: Pick<RunTask, "assigneeId">): boolean {
  return actor.role === "admin" || run.managerId === actor.id || task.assigneeId === actor.id;
}

// AC-TASK-04: запуск «completed», коли всі обов'язкові задачі «done»; необов'язкові статусу не змінюють.
export function runStatus(tasks: readonly Pick<RunTask, "required" | "status">[]): RunStatus {
  return tasks.every((t) => !t.required || t.status === "done") ? "completed" : "in_progress";
}

export const MSG_CANNOT_UNDO = "This cannot be undone";

// AC-TASK-04, AC-TASK-16: остання обов'язкова задача «to do» — позначка лише після підтвердження.
export function needsConfirmation(tasks: readonly Pick<RunTask, "id" | "required" | "status">[], taskId: string) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.required || task.status !== "to_do") return false;
  return tasks.every((t) => t.id === taskId || !t.required || t.status === "done");
}

export type MarkResult =
  | { ok: true; run: Run }
  | { ok: false; error: string; run: Run }
  | { ok: false; confirm: true; run: Run };

// Позначка задачі виконаною. Повторна позначка вже «done» задачі нічого не змінює (припущення PM). Останню обов'язкову
// задачу позначаємо лише з confirmed: true; без підтвердження (або після скасування) нічого не змінюється.
export function markTaskDone(
  actor: Actor,
  run: Run,
  taskId: string,
  options: { confirmed?: boolean } = {},
): MarkResult {
  const task = run.tasks.find((t) => t.id === taskId);
  if (!task || !canMarkDone(actor, run, task)) {
    return { ok: false, error: MSG_NOT_ALLOWED_TO_MARK, run };
  }
  if (task.status === "done") return { ok: true, run };
  if (needsConfirmation(run.tasks, taskId) && !options.confirmed) return { ok: false, confirm: true, run };
  const tasks = run.tasks.map((t) => (t.id === taskId ? { ...t, status: "done" as const } : t));
  return { ok: true, run: { ...run, tasks, status: runStatus(tasks) } };
}

// AC-TASK-15: позначка обов'язковості біля статусу задачі.
export function requiredLabel(required: boolean): string {
  return required ? "required" : "optional";
}

// AC-TASK-10: чужий запуск за прямим посиланням.
export const MSG_RUN_NOT_FOUND = "Run not found";

// AC-TASK-14: список запусків — від найновішого до найстаршого.
export function newestFirst<T extends { createdAt: string }>(runs: readonly T[]): T[] {
  return runs.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// AC-TASK-08: статус задачі на сторінці запуску — «done» або «to do» (терміни глосарію PM).
export function taskStatusLabel(status: string): string {
  return status === "done" ? "done" : "to do";
}

// Статус запуску на сторінках — «in progress» або «completed» (глосарій PM).
export function runStatusLabel(status: string): string {
  return status === "completed" ? "completed" : "in progress";
}

// AC-TASK-05, AC-TASK-09: «N of M done», N — задачі «done», M — усі задачі запуску (обов'язкові й ні).
export function progressLabel(tasks: readonly { status: string }[]): string {
  const done = tasks.filter((t) => t.status === "done").length;
  return `${done} of ${tasks.length} done`;
}

// AC-VENDOR-03, AC-VENDOR-05: «Your tasks: N of K done» — лише задачі userId серед переданих.
export function yourTasksLabel(tasks: readonly { assigneeId: string; status: string }[], userId: string): string {
  const own = tasks.filter((t) => t.assigneeId === userId);
  const done = own.filter((t) => t.status === "done").length;
  return `Your tasks: ${done} of ${own.length} done`;
}

// AC-TASK-06: адміністратор бачить усі запуски; менеджер — ті, де він менеджер запуску або виконавець хоча б однієї
// задачі. Ту саму умову в базі перевіряє private.can_see_run (RLS).
export function canSeeRun(actor: Actor, run: Pick<Run, "managerId" | "tasks">): boolean {
  return (
    actor.role === "admin" || run.managerId === actor.id || run.tasks.some((t) => t.assigneeId === actor.id)
  );
}

export function visibleRuns<T extends Pick<Run, "managerId" | "tasks">>(actor: Actor, runs: readonly T[]): T[] {
  return runs.filter((run) => canSeeRun(actor, run));
}
