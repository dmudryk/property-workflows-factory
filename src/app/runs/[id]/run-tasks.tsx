"use client";

import { Loader2Icon } from "lucide-react";
import { useOptimistic } from "react";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupBySection, needsConfirmation, progressLabel, requiredLabel, yourTasksLabel, type TaskStatus } from "@/lib/runs/rules";
import { markDone } from "../actions";

export type RunTaskView = {
  id: string;
  sectionName: string;
  name: string;
  required: boolean;
  position: number;
  status: TaskStatus;
  assigneeLabel: string;
  canMark: boolean;
};

// Прогрес і задачі запуску з оптимістичною позначкою (DESIGN.md, розділ 6): після «Mark as done» задача одразу
// показана виконаною, а прогрес перераховано; сервер підтверджує (redirect оновлює сторінку) або повертає помилку —
// тоді задача знову «to do», а над списком повідомлення. Остання обов'язкова задача — без оптимізму: сервер спершу
// просить підтвердження (AC-TASK-04, AC-TASK-16). Права перевіряє сервер і база, як і раніше (AC-TASK-03).
export function RunTasks({
  runId,
  tasks,
  header,
  notices,
  vendor = false,
}: {
  vendor?: boolean;
  runId: string;
  tasks: RunTaskView[];
  header: React.ReactNode;
  notices: React.ReactNode;
}) {
  const [shown, showDone] = useOptimistic(tasks, (state, taskId: string) =>
    state.map((t) => (t.id === taskId ? { ...t, status: "done" as const } : t)),
  );
  const saved = new Map(tasks.map((t) => [t.id, t.status]));

  async function submit(formData: FormData) {
    const taskId = String(formData.get("task_id") ?? "");
    if (!needsConfirmation(shown, taskId)) showDone(taskId);
    await markDone(formData);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {header}
        <p data-testid="run-progress" className="text-lg font-semibold tabular-nums">
          {vendor
            ? yourTasksLabel(
                shown.map((t) => ({ assigneeId: "self", status: t.status })),
                "self",
              )
            : progressLabel(shown)}
        </p>
      </div>

      {notices}

      {groupBySection(shown).map((section) => (
        <Card key={section.name} size="sm">
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">{section.name}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {section.tasks.map((task) => (
                <li
                  key={task.id}
                  data-testid="run-task"
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{task.name}</span>
                    {vendor ? null : (
                      <span data-testid="task-assignee" className="text-sm text-muted-foreground">
                        {task.assigneeLabel}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <span data-testid="task-required" className="text-sm text-muted-foreground">
                      {requiredLabel(task.required)}
                    </span>
                    {task.status !== saved.get(task.id) ? (
                      <span role="status" className="text-muted-foreground">
                        <Loader2Icon className="size-4 motion-safe:animate-spin" aria-hidden />
                        <span className="sr-only">Saving</span>
                      </span>
                    ) : null}
                    <StatusBadge data-testid="task-status" kind={task.status === "done" ? "done" : "to_do"} />
                    {task.status === "to_do" && task.canMark ? (
                      <form action={submit}>
                        <input type="hidden" name="run_id" value={runId} />
                        <input type="hidden" name="task_id" value={task.id} />
                        <SubmitButton variant="outline" pendingLabel="Marking…">
                          Mark as done
                        </SubmitButton>
                      </form>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
