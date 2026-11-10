"use client";

import { ChevronRightIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { ROW_LINK_ROW, RowLink } from "@/components/row-link";
import { Segmented } from "@/components/segmented";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { countByStatus, filterRuns, progressPercent, type RunFilter, type RunListItem } from "@/lib/runs/list";

const FILTERS: { value: RunFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const HEAD = "h-11 px-2 text-sm font-medium tracking-wide text-muted-foreground uppercase sm:px-4";
const CELL = "px-2 py-3 sm:px-4";

// Таблиця списку запусків: вкладки статусу з кількістю й пошук за назвою випадку (на клієнті, над рядками сторінки).
// Рядок відкривається кліком будь-де (RowLink); шеврон — лише іконка, тож для клавіатури це одне посилання.
export function RunsTable({ runs, vendor = false }: { runs: RunListItem[]; vendor?: boolean }) {
  const [filter, setFilter] = useState<RunFilter>("all");
  const [query, setQuery] = useState("");
  const counts = countByStatus(runs);
  const visible = filterRuns(runs, filter, query);

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted p-3">
        <Segmented
          label="Filter runs by status"
          value={filter}
          onChange={setFilter}
          className="w-full sm:w-auto"
          options={FILTERS.map(({ value, label }) => ({
            value,
            label: (
              <>
                {label}
                <span className="rounded-full bg-muted px-1.5 text-sm font-medium tabular-nums">{counts[value]}</span>
              </>
            ),
          }))}
        />
        <div className="relative w-full sm:w-64">
          <label htmlFor="runs-search" className="sr-only">
            Search by case name
          </label>
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="runs-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by case name"
            className="h-11 bg-background pl-9"
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <Table className="md:min-w-[45rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={HEAD}>Case</TableHead>
              <TableHead className={HEAD}>Status</TableHead>
              <TableHead className={HEAD}>Progress</TableHead>
              <TableHead className="hidden w-12 sm:table-cell">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((run) => (
              <TableRow key={run.id} data-testid="run-row" className={`${ROW_LINK_ROW} border-border/60 hover:bg-muted`}>
                <TableCell className={`${CELL} whitespace-normal`}>
                  <RowLink href={`/runs/${run.id}`}>{run.caseName}</RowLink>
                  {vendor ? null : <span className="block text-sm text-muted-foreground">{run.templateName}</span>}
                </TableCell>
                <TableCell className={CELL}>
                  <StatusBadge data-testid="run-status" kind={run.status} />
                </TableCell>
                <TableCell className={CELL}>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    {vendor ? null : (
                      <ProgressBar kind={run.status} percent={progressPercent(run)} className="sm:w-24" />
                    )}
                    <span data-testid="run-progress" className="text-sm font-medium tabular-nums">
                      {run.progress}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden w-12 pr-4 sm:table-cell">
                  <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="px-4 py-8 text-center text-base text-muted-foreground">
          {query.trim() ? "No runs match this search." : "No runs with this status yet."}
        </p>
      )}
    </div>
  );
}
