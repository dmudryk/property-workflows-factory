import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MSG_BACK_TO_TEMPLATES, MSG_NOT_ENOUGH_RIGHTS } from "@/lib/templates/content";

// Відмова в правах — у тій самій розкладці, що й інші сторінки (AppShell), без даних сторінки (AC-DSYS-02, AC-EDITOR-07).
export function NotEnoughRights({
  backHref = "/templates",
  backLabel = MSG_BACK_TO_TEMPLATES,
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p role="alert" data-testid="not-enough-rights" className="text-lg font-semibold">
            {MSG_NOT_ENOUGH_RIGHTS}
          </p>
          <Link href={backHref} className="text-sm underline-offset-4 hover:underline">
            {backLabel}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
