-- Вендор бачить лише свої задачі (AC-VENDOR-03, 04, 05). Менеджер і адміністратор — усі задачі запусків, які бачать.
drop policy run_tasks_select_visible on public.run_tasks;
create policy run_tasks_select_visible on public.run_tasks
  for select to authenticated
  using (
    (select private.can_see_run(run_id))
    and (
      (select private.current_app_role()) is distinct from 'vendor'
      or assignee_id = (select auth.uid())
    )
  );
