import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { NotEnoughRights } from "@/components/not-enough-rights";
import { canManageTemplates, requireActor } from "@/lib/auth/actor";
import { canSeeTemplates } from "@/lib/auth/roles";
import { templatesEmptyState } from "@/lib/templates/empty-states";
import { TemplatesTable } from "./templates-table";

// Список шаблонів (impl-ws7-templates/design.md, U1). Які шаблони видно — вирішує RLS (templates_select_visible):
// адміністратор — усі, менеджер — лише збережені як версія (AC-EDITOR-02). Позначка «Unpublished changes» — лише
// адміністратору: незбережені зміни менеджер не читає (template_drafts_select_admin).
export default async function TemplatesPage() {
  const { supabase, actor } = await requireActor();
  if (!canSeeTemplates(actor)) return <NotEnoughRights backHref="/runs" backLabel="Back to runs" />;
  const admin = canManageTemplates(actor);

  const { data: templates } = await supabase.from("templates").select("id, name, current_version").order("name");
  const { data: drafts } = admin ? await supabase.from("template_drafts").select("template_id") : { data: null };
  const unpublished = new Set((drafts ?? []).map((d) => d.template_id));
  const rows = (templates ?? []).map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    version: tpl.current_version,
    unpublished: unpublished.has(tpl.id),
  }));

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Templates"
        description="Every process blueprint, with the version that new runs start from."
        actions={
          admin ? (
            <Link href="/templates/new" className={buttonVariants({ size: "xl" })}>
              <PlusIcon aria-hidden />
              New template
            </Link>
          ) : null
        }
      />
      {rows.length > 0 ? (
        <TemplatesTable templates={rows} showStatus={admin} />
      ) : (
        // AC-EDITOR-17: порожній список — текст (і посилання для адміністратора), без порожньої таблиці.
        <EmptyState {...templatesEmptyState(admin)} />
      )}
    </main>
  );
}
