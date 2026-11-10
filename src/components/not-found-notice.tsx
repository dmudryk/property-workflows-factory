import Link from "next/link";

// Спільна сторінка «не знайдено»: посилання назад і повідомлення з role="alert".
export function NotFoundNotice({
  backHref,
  backLabel,
  message,
  testId,
}: {
  backHref: string;
  backLabel: string;
  message: string;
  testId?: string;
}) {
  return (
    <main className="flex flex-col gap-4">
      <Link href={backHref} className="text-sm underline-offset-4 hover:underline">
        {backLabel}
      </Link>
      <p role="alert" data-testid={testId} className="text-lg font-semibold">
        {message}
      </p>
    </main>
  );
}
