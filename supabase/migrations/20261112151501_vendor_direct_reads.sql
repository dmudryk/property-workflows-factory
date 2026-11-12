-- Вендор читає запуски й задачі лише через функції з білим списком колонок — і на сторінках, і запитом напряму.
-- Двійник: та сама вада, що в основному репо (розбір викладача 12.11; dmudryk/property-workflows#53). RLS фільтрує
-- рядки, а не колонки. Політики зрізів 1 і 3
-- давали вендору рядок свого запуску цілком (template_id, template_name, template_version, manager_id) і рядки своїх
-- задач цілком (done_by — id того, хто позначив, зокрема менеджера). Сторінки ці поля лише не показували.
-- Вимога PM: «Every limit in the rights matrix of the Product is enforced for direct requests too» — матриця прав:
-- «See which template version a run follows — vendor: —», «See other users' profiles — vendor: —»; AC-VENDOR-04, 11, 17, 18.
-- Рішення — ADR 0005 основного репо: таблиці runs і run_tasks вендору закрито (select * → 0 рядків); замість них — функції security
-- definer у private (фільтр рядків — у самій функції: роль vendor, auth.uid(), can_see_run) з обгортками в public.
-- Гранти на колонки тут не допоможуть: усі, хто увійшов, — одна роль Postgres authenticated.

-- ── 1. Таблиці runs і run_tasks — не для вендора (менеджер і адміністратор — як раніше) ──
drop policy runs_select_visible on public.runs;
create policy runs_select_visible on public.runs
  for select to authenticated
  using ((select private.current_app_role()) is distinct from 'vendor' and (select private.can_see_run(id)));

drop policy run_tasks_select_visible on public.run_tasks;
create policy run_tasks_select_visible on public.run_tasks
  for select to authenticated
  using ((select private.current_app_role()) is distinct from 'vendor' and (select private.can_see_run(run_id)));

-- ── 2. Запуски вендора: лише ті, де він виконавець; лише назва випадку, статус і час запуску (AC-VENDOR-03, 06, 10, 11, 12) ──
create or replace function private.vendor_runs(p_run_id uuid default null)
returns table (id uuid, case_name text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.case_name, r.status, r.created_at
  from public.runs as r
  where (select private.current_app_role()) = 'vendor'
    and (p_run_id is null or r.id = p_run_id)
    and (select private.can_see_run(r.id))
  order by r.created_at desc;
$$;

revoke execute on function private.vendor_runs(uuid) from public, anon;
grant execute on function private.vendor_runs(uuid) to authenticated;

create or replace function public.vendor_runs(p_run_id uuid default null)
returns table (id uuid, case_name text, status text, created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.vendor_runs(p_run_id);
$$;

revoke execute on function public.vendor_runs(uuid) from public, anon;
grant execute on function public.vendor_runs(uuid) to authenticated;

-- ── 3. Задачі вендора: лише свої; без виконавця, часу й автора позначки (AC-VENDOR-04, 05, 16, 17) ──
create or replace function private.vendor_tasks(p_run_id uuid default null)
returns table (id uuid, run_id uuid, section_name text, name text, required boolean, "position" integer, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.run_id, t.section_name, t.name, t.required, t.position, t.status
  from public.run_tasks as t
  where (select private.current_app_role()) = 'vendor'
    and t.assignee_id = (select auth.uid())
    and (p_run_id is null or t.run_id = p_run_id)
  order by t.run_id, t.position;
$$;

revoke execute on function private.vendor_tasks(uuid) from public, anon;
grant execute on function private.vendor_tasks(uuid) to authenticated;

create or replace function public.vendor_tasks(p_run_id uuid default null)
returns table (id uuid, run_id uuid, section_name text, name text, required boolean, "position" integer, status text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.vendor_tasks(p_run_id);
$$;

revoke execute on function public.vendor_tasks(uuid) from public, anon;
grant execute on function public.vendor_tasks(uuid) to authenticated;
