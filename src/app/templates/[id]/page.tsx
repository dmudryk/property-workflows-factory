import { CircleIcon, HistoryIcon, PencilIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { Chip } from "@/components/chip";
import { NumberBadge } from "@/components/number-badge";
import { PageHeader } from "@/components/page-header";
import { RequirementPill } from "@/components/requirement-pill";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotEnoughRights } from "@/components/not-enough-rights";
import { NotFoundNotice } from "@/components/not-found-notice";
import { canManageTemplates, requireActor } from "@/lib/auth/actor";
import { canSeeTemplates } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { EMPTY_CONTENT, parseContent, summarizeContent } from "@/lib/templates/content";
import { versionSavedMessage } from "@/lib/templates/editor-state";
import { countLabel, versionLabel } from "@/lib/templates/format";

// Шаблон: поточна версія з секціями й задачами, кожна з позначкою «required» чи «optional», і посилання «Launch»
// (AC-EDITOR-02). Адміністратор додатково бачить позначку «Unpublished changes» (AC-EDITOR-01), посилання на редактор і
// список версій, а після збереження — «Version N saved» (AC-EDITOR-03). Шаблон, якого користувач не бачить (RLS:
// менеджер — лише збережені), — «Template not found» без секцій і задач (AC-EDITOR-16).
export default async function TemplatePage({ params, searchParams }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const { saved: savedParam } = await searchParams;
  const { supabase, actor } = await requireActor();
  if (!canSeeTemplates(actor)) return <NotEnoughRights backHref="/runs" backLabel="Back to runs" />;
  const admin = canManageTemplates(actor);

  const { data: tpl } = await supabase
    .from("templates")
    .select("id, name, current_version, current_content")
    .eq("id", id)
    .maybeSingle();
  if (!tpl) return <NotFoundNotice backHref="/templates" backLabel="Back to templates" message="Template not found" />;

  const { data: draft } = admin
    ? await supabase.from("template_drafts").select("template_id").eq("template_id", id).maybeSingle()
    : { data: null };
  const content = parseContent(tpl.current_content) ?? EMPTY_CONTENT;
  const summary = summarizeContent(content);
  const saved = tpl.current_version !== null;
  // Повідомлення лише про поточну версію: застарілий чи вигаданий ?saved= нічого не показує.
  const justSaved = admin && saved && savedParam === String(tpl.current_version);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/templates", label: "Back to templates" }}
        title={tpl.name}
        badges={
          <>
            {saved ? (
              <Badge
                data-testid="template-version"
                className="h-7 bg-accent px-3 text-sm text-accent-foreground tabular-nums"
              >
                {versionLabel(tpl.current_version)}
              </Badge>
            ) : null}
            {draft ? <StatusBadge data-testid="unpublished" kind="unpublished" /> : null}
          </>
        }
        details={
          saved ? (
            <>
              <Chip>{countLabel(summary.sections, "section")}</Chip>
              <Chip>{countLabel(summary.tasks, "task")}</Chip>
              <Chip>
                {summary.required} required · {summary.optional} optional
              </Chip>
            </>
          ) : null
        }
        actions={
          admin ? (
            <>
              {/* cn: buttonVariants (cva) не зливає border-transparent бази з border-border варіанта outline. */}
              {saved ? (
                <Link
                  href={`/runs/new?template=${id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "xl" }))}
                >
                  <PlayIcon aria-hidden />
                  Launch
                </Link>
              ) : null}
              <Link
                href={`/templates/${id}/versions`}
                className={cn(buttonVariants({ variant: "outline", size: "xl" }))}
              >
                <HistoryIcon aria-hidden />
                Versions
              </Link>
              <Link href={`/templates/${id}/edit`} className={buttonVariants({ size: "xl" })}>
                <PencilIcon aria-hidden />
                Edit template
              </Link>
            </>
          ) : saved ? (
            // Менеджеру «Launch» — основна дія сторінки (припущення PM до AC-EDITOR-02).
            <Link href={`/runs/new?template=${id}`} className={buttonVariants({ size: "xl" })}>
              <PlayIcon aria-hidden />
              Launch
            </Link>
          ) : null
        }
      />

      {justSaved ? (
        <p role="status" data-testid="version-saved" className="text-base">
          {versionSavedMessage(tpl.current_version!)}
        </p>
      ) : null}

      {!saved ? (
        <p className="text-base text-muted-foreground">This template has no saved version yet.</p>
      ) : (
        content.sections.map((section, index) => (
          <Card key={section.id} className="gap-0 bg-background py-0">
            <div className="flex flex-wrap items-center gap-3 border-b bg-muted px-5 py-3">
              <NumberBadge>{index + 1}</NumberBadge>
              <h2 className="text-lg font-semibold">{section.name}</h2>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {countLabel(section.tasks.length, "task")}
              </span>
            </div>
            <ol className="flex flex-col divide-y divide-border/60">
              {section.tasks.map((task) => (
                <li key={task.id} data-testid="template-task" className="flex min-h-14 items-center gap-3 px-5 py-2">
                  <CircleIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 text-sm">{task.name}</span>
                  <RequirementPill required={task.required} />
                </li>
              ))}
            </ol>
          </Card>
        ))
      )}
    </main>
  );
}
