"use client";

import { LayoutTemplateIcon, ListChecksIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const ITEMS = [
  { href: "/runs", label: "Runs", icon: ListChecksIcon },
  { href: "/templates", label: "Templates", icon: LayoutTemplateIcon },
];

// Навігація бічної панелі (DESIGN.md, розділ 4): пункти 44px з іконкою; поточний розділ — тло accent, напівжирний
// текст і aria-current. Коли панель над вмістом (контейнер AppShell < 50rem), пункти стоять у рядок.
export function SidebarNav({ labelledBy, showTemplates = true }: { labelledBy?: string; showTemplates?: boolean }) {
  const pathname = usePathname();
  const items = showTemplates ? ITEMS : ITEMS.filter((item) => item.href !== "/templates");

  return (
    <nav aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : "Main"} className="flex gap-1 @min-[50rem]:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex h-11 flex-1 items-center gap-3 rounded-lg px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring @min-[50rem]:flex-none",
              current
                ? "bg-accent font-semibold text-accent-foreground"
                : "font-medium text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
