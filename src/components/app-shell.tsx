import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { SubmitButton } from "@/components/submit-button";
import { ThemeSelect } from "@/components/theme-select";
import { Badge } from "@/components/ui/badge";

// Одна розкладка для всіх сторінок, зокрема для входу (DESIGN.md, розділ 4). Для користувача, який увійшов, — бічна
// панель (логотип, навігація, картка користувача з виходом) і вміст в одному рядку з переносом: коли поруч не
// вміщаються 15rem панелі й 35rem вмісту (контейнер < 50rem), панель стає над вмістом. Гостю переходити нікуди, тож
// панелі немає, а логотип — у картці входу. Вміст сторінки — у тому самому контейнері. Вибір «Theme» (ADR 0003) —
// у картці користувача, а гостю — під вмістом сторінки входу: тема діє на всіх сторінках, зокрема на вході.
export function AppShell({
  user,
  children,
}: {
  user?: { email: string | null; role: string | null } | null;
  children: React.ReactNode;
}) {
  const content = (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">{children}</div>
  );
  if (!user) {
    return (
      <div data-testid="app-shell" className="flex flex-1 flex-col">
        {content}
        <div className="mx-auto flex w-full max-w-4xl justify-end px-4 pb-6 sm:px-6">
          <div className="w-44">
            <ThemeSelect />
          </div>
        </div>
      </div>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  // Обгортка — контейнер для запитів @min-[50rem], рядок усередині: над вмістом панель лише своєї висоти (content-start).
  return (
    <div data-testid="app-shell" className="@container flex flex-1 flex-col">
      <div className="flex flex-1 flex-wrap @max-[50rem]:content-start">
        <aside className="flex min-w-0 flex-[1_1_15rem] flex-col gap-6 border-b bg-muted p-4 @min-[50rem]:border-r @min-[50rem]:border-b-0 @min-[50rem]:py-6">
          <Link
            href="/"
            className="inline-flex self-start rounded-lg px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>
          <div className="flex flex-col gap-2">
            <p id="sidebar-nav-label" className="px-3 text-sm font-medium tracking-wider text-muted-foreground uppercase">
              Workspace
            </p>
            <SidebarNav labelledBy="sidebar-nav-label" showTemplates={user.role !== "vendor"} />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-background p-3 shadow-xs @min-[50rem]:mt-auto">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground"
              >
                {initial}
              </span>
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span data-testid="user-email" title={user.email ?? undefined} className="w-full truncate text-sm font-medium">
                  {user.email ?? "—"}
                </span>
                <Badge variant="secondary" data-testid="user-role" className="h-6 px-2.5 text-sm">
                  {user.role ?? "no role"}
                </Badge>
              </div>
            </div>
            <ThemeSelect />
            <form action={signOut}>
              <SubmitButton variant="outline" size="xl" pendingLabel="Signing out…" className="w-full">
                <LogOutIcon aria-hidden />
                Sign out
              </SubmitButton>
            </form>
          </div>
        </aside>
        {/* Колонка вмісту — контейнер (cqw): смуга на всю її ширину, як-от смуга збереження редактора. */}
        <div className="@container/content flex min-w-0 flex-[999_1_35rem] flex-col">{content}</div>
      </div>
    </div>
  );
}
