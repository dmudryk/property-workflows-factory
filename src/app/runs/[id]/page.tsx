import Link from "next/link";
import { NotFoundNotice } from "@/components/not-found-notice";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { MSG_CANNOT_UNDO, MSG_RUN_NOT_FOUND, canMarkDone, needsConfirmation, staffLabel } from "@/lib/runs/rules";
import { requireActor } from "@/lib/auth/actor";
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

  const { data: run } = await supabase
    .from("runs")
    .select("id, case_name, template_name, template_version, status, manager_id")
    .eq("id", id)
    .maybeSingle();
  const notFound = (
    <NotFoundNotice backHref="/runs" backLabel="Back to runs" message={MSG_RUN_NOT_FOUND} testId="run-not-found" />
  );
  if (!run) return notFound;

  const vendor = actor?.role === "vendor";
  const [{ data: allRows }, { data: staff }] = await Promise.all([
    supabase
      .from("run_tasks")
      .select("id, section_name, name, required, position, assignee_id, status")
      .eq("run_id", id)
      .order("position"),
    vendor ? Promise.resolve({ data: null }) : supabase.rpc("list_staff"),
  ]);
  const rows = vendor ? (allRows ?? []).filter((t) => t.assignee_id === actor?.id) : allRows;
  if (vendor && rows?.length === 0) return notFound;
  const people = new Map((staff ?? []).map((member) => [member.id, member]));
  const tasks: RunTaskView[] = (rows ?? []).map((t) => ({
    id: t.id,
    sectionName: t.section_name,
    name: t.name,
    required: t.required,
    position: t.position,
    status: taskStatusKind(t.status),
    assigneeLabel: staffLabel(people.get(t.assignee_id)),
    canMark: actor ? canMarkDone(actor, { managerId: run.manager_id }, { assigneeId: t.assignee_id }) : false,
  }));

  const confirmTask =
    typeof confirm === "string" && needsConfirmation(tasks, confirm) ? tasks.find((t) => t.id === confirm) : undefined;

  const header = (
    <>
      <Link href="/runs" className="text-sm underline-offset-4 hover:underline">
        Back to runs
      </Link>
      <h1 className="text-2xl font-semibold">{run.case_name}</h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {vendor ? null : (
          <>
            <span>{run.template_name}</span>
            <span data-testid="template-version" className="tabular-nums">
              {templateVersionLabel(run.template_version)}
            </span>
          </>
        )}
        <StatusBadge data-testid="run-status" kind={runStatusKind(run.status)} />
        {vendor ? null : (
          <span>
            Run manager: <span data-testid="run-manager">{staffLabel(people.get(run.manager_id))}</span>
          </span>
        )}
      </div>
    </>
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
