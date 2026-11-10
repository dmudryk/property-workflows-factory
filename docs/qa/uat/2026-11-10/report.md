# Звіт UAT — 10.11.2026

- **Застосунок:** https://property-workflows-factory-gamma.vercel.app (/api/health: коміт `86b6eee`)
- **Код тестів:** `uat/vendor` @ `9c295a5`
- **Прогін:** 10.11.2026, 14:30 (Київ), Playwright 99.4 с; AC: 10 — PASS 10, FAIL 0, NEEDS-HUMAN 0
- **Рецензент:** `claude-haiku-5-5`; суперечки → `claude-sonnet-5-5`. Разом за розбір: $0.0231 (ціни API; за підпискою — у межах ліміту плану)
- **Прибирання:** синтетичних uat-*@example.test видалено 5, лишилось 0, їхніх рядків, що лишились: 0
- **Відео й траси:** не в git — `test-results/` локально або артефакт CI; трасу відкриває `npx playwright show-trace <trace.zip>`

| AC | Перевірки | Агент | Підсумок | Чому | Playwright | Розбір |
|---|---|---|---|---|---|---|
| AC-VENDOR-01 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 17.5 с | $0.0026, 8.1 с |
| AC-VENDOR-02 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 8.7 с | $0.0028, 9.5 с |
| AC-VENDOR-03 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 3.5 с | $0.0023, 7.5 с |
| AC-VENDOR-04 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 6.5 с | $0.0023, 7.4 с |
| AC-VENDOR-05 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 7.4 с | $0.0022, 6.7 с |
| AC-VENDOR-06 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 3.3 с | $0.0021, 6.5 с |
| AC-VENDOR-07 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 5.9 с | $0.0024, 8.1 с |
| AC-VENDOR-08 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 5.8 с | $0.0020, 6.0 с |
| AC-VENDOR-09 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 5.4 с | $0.0022, 6.4 с |
| AC-VENDOR-10 | пройшли | Haiku: PASS | **PASS** | R6: перевірки, агент і цитати збігаються | 2.6 с | $0.0021, 6.6 с |

## AC-VENDOR-01 — PASS

**Тест:** AC-VENDOR-01: менеджер A запускає «Tenant move-in» і призначає вендора V виконавцем задач 3 і 4 — у задач 1, 2 і 5 виконавець A

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-01: Given manager A, vendor V and the template "Tenant move-in" with 5 tasks. When A launches the template for the case "Apartment 12, move-in" and assigns V as the assignee of tasks 3 and 4. Then tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A.

![Кадр «Тоді» 1](frames/AC-VENDOR-01-then-1.png)

**Кроки:** ✔ Дано: manager A (uat-t1110b-a@example.test), vendor V (uat-t1110b-v1@example.test) and the template "Tenant move-in" with 5 tasks → ✔ Коли: A launches the template for the case "Apartment 12, move-in" and assigns V as the assignee of tasks 3 and 4 → ✔ Тоді: tasks 3 and 4 have V as the assignee, and tasks 1, 2 and 5 have A

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінка «Apartment 12, move-in» з п'ятьма завданнями в порядку шаблону. Завдання 3 і 4 мають uat-t1110b-v1@example.test, а завдання 1, 2 і 5 мають uat-t1110b-a@example.test, що відповідає обом частинам «Тоді». Кадр повний, без завантаження, текст читабельний.

**Цитати агента, звірені зі сторінкою (aria):**
- «Order cleaning uat-t1110b-v1@example.test» — є на сторінці
- «Hand over the keys uat-t1110b-v1@example.test» — є на сторінці
- «Sign the lease uat-t1110b-a@example.test» — є на сторінці
- «Collect the deposit uat-t1110b-a@example.test» — є на сторінці
- «Read the meters uat-t1110b-a@example.test» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-assign-at-launch-AC-087c3--задач-1-2-і-5-виконавець-A-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assign-at-launch-AC-087c3--задач-1-2-і-5-виконавець-A-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-01 — …») · @login: ____

## AC-VENDOR-02 — PASS

**Тест:** AC-VENDOR-02: менеджер A відкриває вибір виконавця — email B, адміністратора й V, без імен, ролей і інших даних профілю

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-02: Given managers A and B, an administrator and vendor V, and A launching a template. When A opens the assignee picker. Then A sees the emails of B, of the administrator and of V, and no names, roles or other profile data.

![Кадр «Тоді» 1](frames/AC-VENDOR-02-then-1.png)

**Кроки:** ✔ Дано: managers A (manager.a@example.test) and B (manager.b@example.test), an administrator (admin@example.test) and vendor V (uat-t1110b-v@example.test), and A launching a template → ✔ Коли: A opens the assignee picker → ✔ Тоді: A sees the emails of B, of the administrator and of V, and no names, roles or other profile data

**Агент (claude-haiku-5-5, PASS):** На кадрі frame-then-1.png відкритий випадаючий список виконавців на сторінці «Launch a template»: видно «manager.b@example.test», «admin@example.test» і «uat-t1110b-v@example.test», кожен як окремий рядок. Імен і ролей у списку не видно, окрім першого пункту «Me (run manager)». Список містить і інші адреси (manager.c, pm-admin, uat-t1110b-a тощо), але критерій їх не забороняє, тому це не вада.

**Цитати агента, звірені зі сторінкою (aria):**
- «manager.b@example.test» — є на сторінці
- «admin@example.test» — є на сторінці
- «uat-t1110b-v@example.test» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-assignee-picker-AC--75754-ролей-і-інших-даних-профілю-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-assignee-picker-AC--75754-ролей-і-інших-даних-профілю-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-02 — …») · @login: ____

## AC-VENDOR-03 — PASS

**Тест:** AC-VENDOR-03: вендор V відкриває список запусків — лише «Apartment 12, move-in» зі статусом і «Your tasks: 0 of 2 done», без «Apartment 14, repair»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-03: Given vendor V who is the assignee of 2 tasks in the run "Apartment 12, move-in" and of no task in the run "Apartment 14, repair". When V opens the list of runs. Then V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair".

![Кадр «Тоді» 1](frames/AC-VENDOR-03-then-1.png)

**Кроки:** ✔ Дано: vendor V (uat-t1110b-v@example.test) who is the assignee of 2 tasks in the run "Apartment 12, move-in" and of no task in the run "Apartment 14, repair" → ✔ Коли: V opens the list of runs → ✔ Тоді: V sees only the run "Apartment 12, move-in" with its run status and "Your tasks: 0 of 2 done", and does not see "Apartment 14, repair"

**Агент (claude-haiku-5-5, PASS):** На кадрі /runs видно один рядок таблиці: «Apartment 12, move-in», статус «in progress» і прогрес «Your tasks: 0 of 2 done»; лічильники фільтрів показують All 1 і In progress 1. «Apartment 14, repair» на сторінці не видно, але це частина «Не з кадрів», і я її не оцінював.

**Цитати агента, звірені зі сторінкою (aria):**
- «Apartment 12, move-in» — є на сторінці
- «in progress» — є на сторінці
- «Your tasks: 0 of 2 done» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-runs-list-AC-VENDOR-1f3da-»-без-«Apartment-14-repair»-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-runs-list-AC-VENDOR-1f3da-»-без-«Apartment-14-repair»-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-03 — …») · @login: ____

## AC-VENDOR-04 — PASS

**Тест:** AC-VENDOR-04: вендор V відкриває «Apartment 12, move-in» — рівно задачі 3 і 4 з назвою, секцією, позначкою й статусом, без задач 1, 2, 5, чужих email і прогресу запуску

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-04: Given vendor V who is the assignee of tasks 3 and 4 in the run "Apartment 12, move-in" (5 tasks). When V opens this run. Then V sees exactly tasks 3 and 4, each with its name, its section, the mark "required" or "optional" and its status, and does not see tasks 1, 2 and 5, the emails of other users or the progress of the whole run.

![Кадр «Тоді» 1](frames/AC-VENDOR-04-then-1.png)

**Кроки:** ✔ Дано: vendor V (uat-t1110b-v@example.test) who is the assignee of tasks 3 and 4 in the run "Apartment 12, move-in" (5 tasks) → ✔ Коли: V opens this run → ✔ Тоді: V sees exactly tasks 3 and 4, each with its name, its section, the mark "required" or "optional" and its status, and does not see tasks 1, 2 and 5, the emails of other users or the progress of the whole run

**Агент (claude-haiku-5-5, PASS):** На кадрі frame-then-1.png видно рівно два завдання, кожне в своїй секції: «Before move-in» → «Order cleaning» (optional, to do) і «Move-in day» → «Hand over the keys» (required, to do). Кадр повний, без обрізання і завантаження; завдань 1, 2, 5 та чужих email не видно, але ці частини перевіряють автоматичні перевірки, тож я їх не оцінював.

**Цитати агента, звірені зі сторінкою (aria):**
- «Before move-in» — є на сторінці
- «Order cleaning» — є на сторінці
- «optional» — є на сторінці
- «to do» — є на сторінці
- «Move-in day» — є на сторінці
- «Hand over the keys» — є на сторінці
- «required» — є на сторінці
- «to do» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-run-page-AC-VENDOR--47f1a-их-email-і-прогресу-запуску-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-run-page-AC-VENDOR--47f1a-их-email-і-прогресу-запуску-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-04 — …») · @login: ____

## AC-VENDOR-05 — PASS

**Тест:** AC-VENDOR-05: вендор V позначає задачу 3 (не останню обов'язкову) виконаною — «done» і «Your tasks: 1 of 2 done»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-05: Given vendor V who is the assignee of task 3 with status "to do", which is not the last required task of the run "Apartment 12, move-in". When V marks task 3 as done. Then task 3 has status "done", and V sees "Your tasks: 1 of 2 done".

![Кадр «Тоді» 1](frames/AC-VENDOR-05-then-1.png)

**Кроки:** ✔ Дано: vendor V (uat-t1110b-v5@example.test) who is the assignee of task 3 with status "to do", which is not the last required task of the run "Apartment 12, move-in" → ✔ Коли: V marks task 3 as done → ✔ Тоді: task 3 has status "done", and V sees "Your tasks: 1 of 2 done"

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінка запуску «Apartment 12, move-in»: у картці «Before move-in» завдання «Order cleaning» має мітку «done», а зверху написано «Your tasks: 1 of 2 done», що повністю збігається з критерієм. Частини про перезавантаження, базу даних і відсутність підтвердження кадрами не перевіряються.

**Цитати агента, звірені зі сторінкою (aria):**
- «Order cleaning» — є на сторінці
- «done» — є на сторінці
- «Your tasks: 1 of 2 done» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-mark-done-AC-VENDOR-fbef7--і-«Your-tasks-1-of-2-done»-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-mark-done-AC-VENDOR-fbef7--і-«Your-tasks-1-of-2-done»-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-05 — …») · @login: ____

## AC-VENDOR-06 — PASS

**Тест:** AC-VENDOR-06: вендор V відкриває «Apartment 14, repair» за прямим посиланням — «Run not found», жодної задачі запуску

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-06: Given the run "Apartment 14, repair" in which vendor V has no task. When V opens the page of this run by a direct link. Then V sees the message "Run not found" and none of the tasks of the run.

![Кадр «Тоді» 1](frames/AC-VENDOR-06-then-1.png)

**Кроки:** ✔ Дано: the run "Apartment 14, repair" in which vendor V (uat-t1110b-v@example.test) has no task → ✔ Коли: V opens the page of this run by a direct link → ✔ Тоді: V sees the message "Run not found" and none of the tasks of the run

**Агент (claude-haiku-5-5, PASS):** На кадрі frame-then-1.png видно сторінку з написом «Run not found» під посиланням «Back to runs»; сесія — vendor (uat-t1110b-v@ex…). Задач і назви справи на кадрі не видно. Єдина видима частина «Тоді» — повідомлення — збігається посимвольно.

**Цитати агента, звірені зі сторінкою (aria):**
- «Run not found» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-foreign-run-AC-VEND-37f1f-ound»-жодної-задачі-запуску-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-foreign-run-AC-VEND-37f1f-ound»-жодної-задачі-запуску-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-06 — …») · @login: ____

## AC-VENDOR-07 — PASS

**Тест:** AC-VENDOR-07: вендор V напряму позначає виконаною задачу 1 менеджера A — відмова, задача 1 лишається «to do»

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-07: Given the run "Apartment 12, move-in" in which task 1 is assigned to manager A and tasks 3 and 4 to vendor V. When V tries to mark task 1 as done directly, bypassing the pages of the application. Then task 1 stays "to do".

![Кадр «Тоді» 1](frames/AC-VENDOR-07-then-1.png)

**Кроки:** ✔ Дано: the run "Apartment 12, move-in" in which task 1 is assigned to manager A (uat-t1110b-a@example.test) and tasks 3 and 4 to vendor V (uat-t1110b-v@example.test) → ✔ Коли: V tries to mark task 1 as done directly, bypassing the pages of the application → ✔ Тоді: task 1 stays "to do"

**Агент (claude-haiku-5-5, PASS):** На кадрі видно сторінку запуску «Apartment 12, move-in» з полем «Run manager: uat-t1110b-a@example.test» і лічильником «0 of 5 done». У рядку «Sign the lease» (required, виконавець uat-t1110b-a@example.test) статус «to do», кнопка «Mark as done» не натиснута. Частина «Тоді» підтверджена кадром; відмову 403 і стан БД кадр не показує і я їх не оцінював.

**Цитати агента, звірені зі сторінкою (aria):**
- «Apartment 12, move-in» — є на сторінці
- «Sign the lease» — є на сторінці
- «to do» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-foreign-task-direct-6be40--задача-1-лишається-«to-do»-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-foreign-task-direct-6be40--задача-1-лишається-«to-do»-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-07 — …») · @login: ____

## AC-VENDOR-08 — PASS

**Тест:** AC-VENDOR-08: вендор V відкриває список шаблонів за прямим посиланням — «Not enough rights», жодного шаблону

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-08: Given vendor V signed in. When V opens the list of templates by a direct link. Then V sees the message "Not enough rights" and no template.

![Кадр «Тоді» 1](frames/AC-VENDOR-08-then-1.png)

**Кроки:** ✔ Дано: vendor V (uat-t1110b-v@example.test) signed in → ✔ Коли: V opens the list of templates by a direct link → ✔ Тоді: V sees the message "Not enough rights" and no template

**Агент (claude-haiku-5-5, PASS):** На кадрі видно великий заголовок «Not enough rights» з посиланням «Back to runs», у лівому нижньому куті видно, що ввійшов користувач з роллю vendor. Текст збігається з критерієм посимвольно. Таблиці чи шаблонів на сторінці не видно; частина «no template» не з кадрів і не оцінюється.

**Цитати агента, звірені зі сторінкою (aria):**
- «Not enough rights» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-templates-forbidden-0d58c-ugh-rights»-жодного-шаблону-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-templates-forbidden-0d58c-ugh-rights»-жодного-шаблону-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-08 — …») · @login: ____

## AC-VENDOR-09 — PASS

**Тест:** AC-VENDOR-09: вендор V напряму запускає «Tenant move-in» — запуску не створено, список запусків не змінився

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-09: Given vendor V signed in and the template "Tenant move-in" with current version 1. When V tries to launch this template directly, bypassing the pages of the application. Then no run is created, and the list of runs does not change.

![Кадр «Тоді» 1](frames/AC-VENDOR-09-then-1.png)

**Кроки:** ✔ Дано: vendor V (uat-t1110b-v@example.test) signed in and the template "Tenant move-in" with current version 1 → ✔ Коли: V tries to launch this template directly, bypassing the pages of the application → ✔ Тоді: no run is created, and the list of runs does not change

**Агент (claude-haiku-5-5, PASS):** На кадрі сторінки /runs видно один рядок «Apartment 12, move-in» зі статусом «in progress» і прогресом «Your tasks: 0 of 2 done». Лічильник фільтра «All» також показує 1, а «Completed» — 0, тобто нових запусків у списку немає. Кадр один, тож порівняти зі станом до запиту його самого не можна; відсутність нового запуску в БД не з кадрів і тут не оцінюється.

**Цитати агента, звірені зі сторінкою (aria):**
- «Apartment 12, move-in» — є на сторінці
- «Your tasks: 0 of 2 done» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-launch-direct-AC-VE-ca5d1-список-запусків-не-змінився-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-launch-direct-AC-VE-ca5d1-список-запусків-не-змінився-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-09 — …») · @login: ____

## AC-VENDOR-10 — PASS

**Тест:** AC-VENDOR-10: вендор без задач відкриває список запусків — «No tasks assigned to you yet.», без порожньої таблиці

**Критерій** (requirements/39-assign-a-vendor-own-tasks.md):

> AC-VENDOR-10: Given vendor V to whom no task is assigned. When V opens the list of runs. Then V sees the message "No tasks assigned to you yet." and no empty table.

![Кадр «Тоді» 1](frames/AC-VENDOR-10-then-1.png)

**Кроки:** ✔ Дано: vendor V (uat-t1110b-w@example.test) to whom no task is assigned → ✔ Коли: V opens the list of runs → ✔ Тоді: V sees the message "No tasks assigned to you yet." and no empty table

**Агент (claude-haiku-5-5, PASS):** На кадрі frame-then-1.png (сторінка «Runs», користувач vendor) під заголовком видно блок із текстом «No tasks assigned to you yet.», і він збігається з критерієм посимвольно. Таблиці та заголовків колонок на кадрі не видно, але частину «no empty table» перевіряють автоматично, тож я її не оцінював.

**Цитати агента, звірені зі сторінкою (aria):**
- «No tasks assigned to you yet.» — є на сторінці

**Правило:** R6: перевірки, агент і цитати збігаються

**Відео:** `test-results/artifacts/vendor-runs-empty-AC-VENDO-198f8-yet-»-без-порожньої-таблиці-chromium/video.webm` · **траса:** `test-results/artifacts/vendor-runs-empty-AC-VENDO-198f8-yet-»-без-порожньої-таблиці-chromium/trace.zip` (не в git)

**Рішення PM:** ☐ приймаю · ☐ відхилення від вимог (issue «Відхилення від вимог: AC-VENDOR-10 — …») · @login: ____

## Як читати підсумок

- **PASS** — автоматичні перевірки пройшли, агент-рецензент погодився з кадром, а кожну його цитату знайдено на сторінці.
- **FAIL** — впала автоматична перевірка. Агент цього не перекриває: невидимі вади (буфер обміну, база) він на кадрі не побачить.
- **NEEDS-HUMAN** — перевірки зелені, але агент не погодився або його цитати немає на сторінці. Часто це слабкий тест або розбіжність між текстом AC і тестом — питання до PM, а не обов'язково вада продукту.

Правила: R1: перевірка впала — FAIL завжди, агент не перекриває; R2: немає вердикту агента або кадру; R3: перевірки пройшли, агент не погоджується — вирішує людина; R4: цитати агента немає на сторінці (aria) — не підтверджено; R5: помилка сторінки або 5xx під час сценарію; R6: перевірки, агент і цитати збігаються.
