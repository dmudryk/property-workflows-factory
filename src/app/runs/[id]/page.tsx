import Link from "next/link";
import { NotFoundNotice } from "@/components/not-found-notice";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { MSG_CANNOT_UNDO, MSG_RUN_NOT_FOUND, canMarkDone, needsConfirmation, staffLabel } from "@/lib/runs/rules";
import { requireActor } from "@/lib/auth/actor";
import { loadRun } from "@/lib/runs/run-reads";
import { runStatusKind, taskStatusKind } from "@/lib/status";
import { templateVersionLabel } from "@/lib/templates/format";
import { markDone } from "../actions";
import { RUN_ERRORS, messageFor } from "../messages";
import { RunTasks, type RunTaskView } from "./run-tasks";

// Сторінка запуску: прогрес «N of M done» (AC-TASK-05), задачі групами за секціями (AC-TASK-12) з email виконавця
// (AC-TASK-11), статусом (AC-TASK-08) і позначкою «required»/«optional» (AC-TASK-15). «Mark as done» — лише тому, хто
// може позначити задачу (AC-TASK-18); остання обов'язкова — з підтвердженням (AC-TASK-04, AC-TASK-16). Права перевіряє
// й база, відмова — повідомлення AC-TASK-03. Запуск, якого користувач не бачить (RLS), — «Run not found» (AC-TASK-10).
// Версія шаблону, з якої створено запуск, — «Template version N» (AC-EDITOR-06). Прогрес і задачі показує RunTasks
// (позначка «Mark as done» — оптимістично, DESIGN.md, розділ 6).
export default async function RunPage({ params, searchParams }: PageProps<"/runs/[id]">) {
  const { id } = await params;
  const { error, confirm } = await searchParams;
  const message = messageFor(RUN_ERRORS, error);
  const { supabase, actor } = await requireActor();

  const vendor = actor?.role === "vendor";
  // Вендору таблиці runs і run_tasks закрито — запуск і задачі з функцій бази vendor_runs і vendor_tasks, де шаблону,
  // версії й менеджера немає (loadRun).
  const loaded = await loadRun(supabase, id, vendor && actor ? actor.id : null);
  const notFound = (
    <NotFoundNotice backHref="/runs" backLabel="Back to runs" message={MSG_RUN_NOT_FOUND} testId="run-not-found" />
  );
  if (!loaded) return notFound;
  const { run, tasks: allRows } = loaded;
  const staffRun = loaded.vendor ? null : loaded.run;

  // Вендору — лише його задачі (vendor_tasks); запуск без його задач vendor_runs не віддає — тоді «Run not found» вище.
  const { data: staff } = vendor ? { data: null } : await supabase.rpc("list_staff");
  const people = new Map((staff ?? []).map((member) => [member.id, member]));
  const tasks: RunTaskView[] = allRows.map((t) => ({
    id: t.id,
    sectionName: t.section_name,
    name: t.name,
    required: t.required,
    position: t.position,
    status: taskStatusKind(t.status),
    assigneeLabel: staffLabel(people.get(t.assignee_id)),
    canMark: actor ? canMarkDone(actor, { managerId: staffRun?.manager_id ?? "" }, { assigneeId: t.assignee_id }) : false,
  }));

  const confirmTask =
    typeof confirm === "string" && needsConfirmation(tasks, confirm) ? tasks.find((t) => t.id === confirm) : undefined;

  const header = (
    <RunHeader caseName={run.case_name} status={run.status} staffRun={staffRun} managerLabel={staffRun ? staffLabel(people.get(staffRun.manager_id)) : ""} />
  );

  const notices = (
    <>
      {message ? (
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">{message}</AlertDescription>
        </Alert>
      ) : null}

      {confirmTask ? (
        <Alert role="alertdialog" data-testid="confirm-done" className="border-destructive">
          <AlertTitle>Mark &quot;{confirmTask.name}&quot; as done?</AlertTitle>
          <AlertDescription className="text-foreground">{MSG_CANNOT_UNDO}</AlertDescription>
          <div className="mt-3 flex gap-3">
            <form action={markDone}>
              <input type="hidden" name="run_id" value={run.id} />
              <input type="hidden" name="task_id" value={confirmTask.id} />
              <input type="hidden" name="confirmed" value="1" />
              <SubmitButton variant="destructive" pendingLabel="Confirming…">
                Confirm
              </SubmitButton>
            </form>
            <Link href={`/runs/${run.id}`} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </div>
        </Alert>
      ) : null}
    </>
  );

  return (
    <main className="flex flex-col gap-6">
      <RunTasks vendor={vendor} runId={run.id} tasks={tasks} header={header} notices={notices} />
    </main>
  );
}

// Шапка сторінки запуску. Вендору (staffRun = null) — лише назва випадку й статус: шаблону, версії й менеджера в його
// даних немає (loadRun).
function RunHeader({
  caseName,
  status,
  staffRun,
  managerLabel,
}: {
  caseName: string;
  status: string;
  staffRun: { template_name: string; template_version: number } | null;
  managerLabel: string;
}) {
  return (
    <>
      <Link href="/runs" className="text-sm underline-offset-4 hover:underline">
        Back to runs
      </Link>
      <h1 className="text-2xl font-semibold">{caseName}</h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {staffRun ? (
          <>
            <span>{staffRun.template_name}</span>
            <span data-testid="template-version" className="tabular-nums">
              {templateVersionLabel(staffRun.template_version)}
            </span>
          </>
        ) : null}
        <StatusBadge data-testid="run-status" kind={runStatusKind(status)} />
        {staffRun ? (
          <span>
            Run manager: <span data-testid="run-manager">{managerLabel}</span>
          </span>
        ) : null}
      </div>
    </>
  );
}
