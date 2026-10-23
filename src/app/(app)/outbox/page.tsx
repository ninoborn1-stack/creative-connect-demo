import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Outbox" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OutboxPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : undefined;
  const mails = await db.outboxMail.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const selected = mails.find((m) => m.id === id);

  return (
    <>
      <PageHeader title="Outbox" description="Alle E-Mails, die die Plattform verschicken würde." />
      <div role="note" className="mb-6 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p><strong>Demo:</strong> Hier landen alle E-Mails – nichts wird wirklich versendet. Später übernimmt ein EU-Mailanbieter den Versand.</p>
      </div>

      {mails.length === 0 ? (
        <EmptyState icon={Mail} title="Noch keine E-Mails" description="Sobald Anfragen, Zusagen oder Einladungen verschickt werden, erscheinen sie hier." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <ul className={cn("divide-y overflow-hidden rounded-xl border bg-card", selected && "hidden lg:block")} aria-label="E-Mails">
            {mails.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/outbox?id=${m.id}`}
                  scroll={false}
                  aria-current={m.id === selected?.id ? "true" : undefined}
                  className={cn("block px-4 py-3 hover:bg-muted/50", m.id === selected?.id && "bg-primary/10")}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">an {m.to}</span>
                    <time dateTime={m.createdAt.toISOString()} className="shrink-0 text-xs text-muted-foreground">{formatRelative(m.createdAt)}</time>
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium">{m.subject}</span>
                  <span className="block truncate text-xs text-muted-foreground">{m.body.replace(/\s+/g, " ")}</span>
                </Link>
              </li>
            ))}
          </ul>

          {selected ? (
            <article className="min-w-0 rounded-xl border bg-card" aria-labelledby="mail-subject">
              <div className="border-b p-4 sm:p-6">
                <Link href="/outbox" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
                  <ArrowLeft className="size-4" aria-hidden /> Zur Liste
                </Link>
                <h2 id="mail-subject" className="text-lg font-semibold">{selected.subject}</h2>
                <dl className="mt-2 grid grid-cols-[4rem_minmax(0,1fr)] gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Von</dt>
                  <dd>Creative Connect &lt;noreply@creative-connect.demo&gt;</dd>
                  <dt className="text-muted-foreground">An</dt>
                  <dd className="break-all">{selected.to}</dd>
                  <dt className="text-muted-foreground">Datum</dt>
                  <dd>{formatDateTime(selected.createdAt)}</dd>
                </dl>
              </div>
              <div className="p-4 text-sm leading-relaxed whitespace-pre-line sm:p-6">{selected.body}</div>
            </article>
          ) : (
            <div className="hidden place-items-center rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground lg:grid">
              Wähle links eine E-Mail aus, um sie zu lesen.
            </div>
          )}
        </div>
      )}
    </>
  );
}
