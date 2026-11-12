import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { progressCounts, type RunListItem } from "@/lib/runs/list";
import { runsEmptyState, runsListView } from "@/lib/runs/list-view";
import { newestFirst, progressLabel, yourTasksLabel } from "@/lib/runs/rules";
import { runStatusKind } from "@/lib/status";
import { requireActor } from "@/lib/auth/actor";
import { listRuns } from "@/lib/runs/run-reads";
import { RunsTable } from "./runs-table";

// Список запусків: у кожному рядку — випадок, шаблон, статус і прогрес «N of M done» (AC-TASK-09, AC-TASK-13,
// AC-TASK-17), від найновішого (AC-TASK-14). Які запуски видно — вирішує RLS (private.can_see_run): адміністратор —
// усі; менеджер — ті, де він менеджер запуску або виконавець хоча б однієї задачі (AC-TASK-06). Статус — StatusBadge
// (ті самі слова й колір, що на сторінці запуску, AC-DSYS-01); без запусків — порожній стан без таблиці (AC-DSYS-04).
export default async function RunsPage() {
  const { supabase, actor } = await requireActor();
  const vendor = actor?.role === "vendor";
  // Вендор: без назви шаблону; рядки лише із запусків, де є його задачі (AC-VENDOR-03). Таблиці runs і run_tasks
  // вендору закрито — рядки приходять з функцій бази vendor_runs і vendor_tasks, де назви шаблону немає (listRuns).
  const rows = await listRuns(supabase, vendor && actor ? actor.id : null);
  const runs = newestFirst(
    rows
      .filter((r) => !vendor || (r.run_tasks ?? []).some((t) => t.assignee_id === actor?.id))
      .map((r) => ({ ...r, createdAt: r.created_at })),
  ).map((run): RunListItem => {
    const own = vendor ? (run.run_tasks ?? []).filter((t) => t.assignee_id === actor?.id) : (run.run_tasks ?? []);
    return {
      id: run.id,
      caseName: run.case_name,
      templateName: run.template_name ?? "",
      status: runStatusKind(run.status),
      ...progressCounts(own),
      progress: vendor
        ? yourTasksLabel(
            own.map((t) => ({ assigneeId: t.assignee_id, status: t.status })),
            actor?.id ?? "",
          )
        : progressLabel(own),
    };
  });
  const empty = runsEmptyState(vendor);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Runs"
        description="Every checklist launched from a template, and how far along it is."
        actions={
          vendor ? null : (
            <Link href="/runs/new" className={buttonVariants({ size: "xl" })}>
              <PlusIcon aria-hidden />
              Launch a template
            </Link>
          )
        }
      />
      {runsListView(runs.length) === "table" ? <RunsTable runs={runs} vendor={vendor} /> : <EmptyState {...empty} />}
    </main>
  );
}
