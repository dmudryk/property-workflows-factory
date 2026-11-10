// Список запусків: порожній стан замість порожньої таблиці (AC-DSYS-04). Тексти — дослівно з AC.
export const MSG_NO_RUNS = "No runs yet. Launch a template to start one.";
export const LINK_LAUNCH_TEMPLATE = "Launch a template";
export const LAUNCH_HREF = "/runs/new";

export const MSG_NO_TASKS_ASSIGNED = "No tasks assigned to you yet.";

// AC-VENDOR-10: порожній стан списку запусків; вендору запуск шаблону не пропонуємо.
export function runsEmptyState(vendor: boolean): { message: string; action?: { href: string; label: string } } {
  if (vendor) return { message: MSG_NO_TASKS_ASSIGNED };
  return { message: MSG_NO_RUNS, action: { href: LAUNCH_HREF, label: LINK_LAUNCH_TEMPLATE } };
}

export function runsListView(count: number): "empty" | "table" {
  return count > 0 ? "table" : "empty";
}
