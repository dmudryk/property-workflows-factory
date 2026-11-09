-- Роль vendor (зовнішній підрядник): може бути виконавцем задач, бачить лише свої запуски й задачі.
-- Специфікація: AC-VENDOR-01, 02, 06, 07, 09. Запуск шаблону лишається лише для manager і admin.

-- ── Ролі (порядок — як у заголовку 20261012000000_profiles_and_roles.sql) ──
alter table public.profiles drop constraint profiles_role_check;
-- дані: наявні ролі не змінюються
alter table public.profiles alter column role set default 'manager';
alter table public.profiles add constraint profiles_role_check check (role in ('manager', 'admin', 'vendor'));

-- ── Виконавцем задачі може бути manager, admin або vendor ──
-- Сигнатура та сама: create or replace зберігає гранти; launch_run перевіряє роль того, хто запускає (vendor → NOT_ALLOWED).
create or replace function private.is_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = p_user_id and p.role in ('manager', 'admin', 'vendor')
  );
$$;

-- ── Список для вибору виконавця: лише id і email; вендор не бачить нікого ──
-- Сигнатура та сама, тож create or replace зберігає гранти й обгортку public.list_staff.
create or replace function private.staff()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.email
  from public.profiles as p
  where p.role in ('manager', 'admin', 'vendor')
    and (select private.current_app_role()) in ('manager', 'admin')
  order by p.email;
$$;
